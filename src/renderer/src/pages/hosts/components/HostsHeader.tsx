import type { Host } from '@renderer/types'
import { ChevronDown, Globe, Home, Plus, Settings } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  hosts: Host[]
  activeHost: Host | null
  onSelectHost: (host: Host) => void
  onAddHost: () => void
  onEditHost: (host: Host) => void
}

const HostsHeader: FC<Props> = ({ hosts, activeHost, onSelectHost, onAddHost, onEditHost }) => {
  const { t } = useTranslation()
  const [showWorldDropdown, setShowWorldDropdown] = useState(false)
  const [showRoomDropdown, setShowRoomDropdown] = useState(false)
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null)
  const worldDropdownRef = useRef<HTMLDivElement>(null)
  const roomDropdownRef = useRef<HTMLDivElement>(null)

  // 按 worldName 分组 hosts
  const worldGroups = useMemo(() => {
    const groups: Record<string, Host[]> = {}
    const noWorld: Host[] = []

    hosts.forEach((host) => {
      if (host.worldName) {
        if (!groups[host.worldName]) {
          groups[host.worldName] = []
        }
        groups[host.worldName].push(host)
      } else {
        noWorld.push(host)
      }
    })

    return { groups, noWorld }
  }, [hosts])

  // 所有世界名称
  const worldNames = useMemo(() => Object.keys(worldGroups.groups), [worldGroups])

  // 当前世界下的房间
  const roomsInWorld = useMemo(() => {
    if (selectedWorld === null) {
      return hosts // 显示所有房间
    }
    if (selectedWorld === '__no_world__') {
      return worldGroups.noWorld
    }
    return worldGroups.groups[selectedWorld] || []
  }, [selectedWorld, hosts, worldGroups])

  // 关闭下拉
  const closeDropdowns = useCallback(() => {
    setShowWorldDropdown(false)
    setShowRoomDropdown(false)
  }, [])

  // 点击外部关闭
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        worldDropdownRef.current &&
        !worldDropdownRef.current.contains(target) &&
        roomDropdownRef.current &&
        !roomDropdownRef.current.contains(target)
      ) {
        closeDropdowns()
      }
    },
    [closeDropdowns]
  )

  // 绑定点击事件
  useState(() => {
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  })

  const handleSelectWorld = useCallback(
    (worldName: string | null) => {
      setSelectedWorld(worldName)
      setShowWorldDropdown(false)
    },
    [setSelectedWorld]
  )

  const handleSelectRoom = useCallback(
    (host: Host) => {
      onSelectHost(host)
      setShowRoomDropdown(false)
    },
    [onSelectHost]
  )

  const currentWorldDisplay = useMemo(() => {
    if (selectedWorld === null) {
      return t('hosts.world.all', { defaultValue: '所有世界' })
    }
    if (selectedWorld === '__no_world__') {
      return t('hosts.world.ungrouped', { defaultValue: '未分组' })
    }
    return selectedWorld
  }, [selectedWorld, t])

  return (
    <HeaderContainer>
      {/* World 选择器 */}
      <SelectorContainer ref={worldDropdownRef}>
        <SelectorButton onClick={() => setShowWorldDropdown(!showWorldDropdown)} $active={showWorldDropdown}>
          <Globe size={16} />
          <SelectorLabel>{currentWorldDisplay}</SelectorLabel>
          <ChevronDown size={14} className={showWorldDropdown ? 'rotate' : ''} />
        </SelectorButton>

        {showWorldDropdown && (
          <DropdownMenu>
            <DropdownItem onClick={() => handleSelectWorld(null)} $active={selectedWorld === null}>
              <Globe size={14} />
              <span>{t('hosts.world.all', { defaultValue: '所有世界' })}</span>
            </DropdownItem>
            {worldNames.map((name) => (
              <DropdownItem key={name} onClick={() => handleSelectWorld(name)} $active={selectedWorld === name}>
                <span className="emoji">🌍</span>
                <span>{name}</span>
                <CountBadge>{worldGroups.groups[name].length}</CountBadge>
              </DropdownItem>
            ))}
            {worldGroups.noWorld.length > 0 && (
              <DropdownItem
                onClick={() => handleSelectWorld('__no_world__')}
                $active={selectedWorld === '__no_world__'}>
                <span className="emoji">📁</span>
                <span>{t('hosts.world.ungrouped', { defaultValue: '未分组' })}</span>
                <CountBadge>{worldGroups.noWorld.length}</CountBadge>
              </DropdownItem>
            )}
          </DropdownMenu>
        )}
      </SelectorContainer>

      <Divider />

      {/* Room 选择器 */}
      <SelectorContainer ref={roomDropdownRef}>
        <SelectorButton onClick={() => setShowRoomDropdown(!showRoomDropdown)} $active={showRoomDropdown}>
          <Home size={16} />
          <SelectorLabel>
            {activeHost ? (
              <>
                <span className="emoji">{activeHost.emoji || '🏠'}</span>
                {activeHost.name}
              </>
            ) : (
              t('hosts.room.select', { defaultValue: '选择房间' })
            )}
          </SelectorLabel>
          <ChevronDown size={14} className={showRoomDropdown ? 'rotate' : ''} />
        </SelectorButton>

        {showRoomDropdown && (
          <DropdownMenu>
            {roomsInWorld.length > 0 ? (
              roomsInWorld.map((host) => (
                <DropdownItem key={host.id} onClick={() => handleSelectRoom(host)} $active={activeHost?.id === host.id}>
                  <span className="emoji">{host.emoji || '🏠'}</span>
                  <span className="name">{host.name}</span>
                  {host.worldName && <WorldTag>{host.worldName}</WorldTag>}
                </DropdownItem>
              ))
            ) : (
              <EmptyHint>{t('hosts.room.empty', { defaultValue: '暂无房间' })}</EmptyHint>
            )}
            <DropdownDivider />
            <DropdownItem onClick={onAddHost} $isAction>
              <Plus size={14} />
              <span>{t('hosts.room.create', { defaultValue: '创建房间' })}</span>
            </DropdownItem>
          </DropdownMenu>
        )}
      </SelectorContainer>

      {/* 房间设置按钮 */}
      {activeHost && (
        <SettingsButton
          onClick={() => onEditHost(activeHost)}
          title={t('hosts.settings', { defaultValue: '房间设置' })}>
          <Settings size={16} />
        </SettingsButton>
      )}
    </HeaderContainer>
  )
}

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
`

const SelectorContainer = styled.div`
  position: relative;
`

const SelectorButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${({ $active }) => ($active ? 'var(--color-background-mute)' : 'var(--color-background)')};
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 140px;

  &:hover {
    background: var(--color-background-mute);
  }

  .rotate {
    transform: rotate(180deg);
  }

  svg {
    color: var(--color-text-secondary);
    transition: transform 0.2s ease;
  }
`

const SelectorLabel = styled.span`
  flex: 1;
  text-align: left;
  font-size: 13px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 6px;

  .emoji {
    font-size: 14px;
  }
`

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: var(--color-border);
`

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
`

const DropdownItem = styled.div<{ $active?: boolean; $isAction?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  color: ${({ $isAction }) => ($isAction ? 'var(--color-primary)' : 'var(--color-text)')};
  background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'transparent')};
  transition: background 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'var(--color-background-soft)')};
  }

  .emoji {
    font-size: 16px;
    width: 20px;
    text-align: center;
  }

  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const CountBadge = styled.span`
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: var(--color-background-mute);
  padding: 2px 6px;
  border-radius: 10px;
`

const WorldTag = styled.span`
  font-size: 10px;
  color: var(--color-text-tertiary);
  background: var(--color-background-mute);
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const DropdownDivider = styled.div`
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
`

const EmptyHint = styled.div`
  padding: 16px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 13px;
`

const SettingsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;

  &:hover {
    background: var(--color-background-mute);
  }

  svg {
    color: var(--color-text-secondary);
  }
`

export default HostsHeader
