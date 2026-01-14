import { APP_NAME, AppLogo } from '@renderer/config/env'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useRuntime } from '@renderer/hooks/useRuntime'
import { runAsyncFunction } from '@renderer/utils'
import { Avatar, Progress, Row, Tag } from 'antd'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { SettingContainer, SettingDivider, SettingGroup, SettingTitle } from '.'

const AboutSettings: FC = () => {
  const [version, setVersion] = useState('')
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { update } = useRuntime()

  useEffect(() => {
    runAsyncFunction(async () => {
      const appInfo = await window.api.getAppInfo()
      setVersion(appInfo.version)
    })
  }, [])

  return (
    <SettingContainer theme={theme}>
      <SettingGroup theme={theme}>
        <SettingTitle>
          {t('settings.about.title')}
          {/* GitHub 链接暂时隐藏 */}
          {/* <HStack alignItems="center">
            <Link to="https://github.com/CherryHQ/cherry-studio">
              <GithubOutlined style={{ marginRight: 4, color: 'var(--color-text)', fontSize: 20 }} />
            </Link>
          </HStack> */}
        </SettingTitle>
        <SettingDivider />
        <AboutHeader>
          <Row align="middle">
            <AvatarWrapper>
              {update.downloadProgress > 0 && (
                <ProgressCircle
                  type="circle"
                  size={84}
                  percent={update.downloadProgress}
                  showInfo={false}
                  strokeLinecap="butt"
                  strokeColor="#67ad5b"
                />
              )}
              <Avatar src={AppLogo} size={80} style={{ minHeight: 80 }} />
            </AvatarWrapper>
            <VersionWrapper>
              <Title>{APP_NAME}</Title>
              <Description>{t('settings.about.description')}</Description>
              <Tag
                color="cyan"
                style={{ marginTop: 8 }}>
                v{version}
              </Tag>
            </VersionWrapper>
          </Row>
          {/* 立即更新按钮暂时隐藏 */}
          {/* {!isPortable && (
            <CheckUpdateButton
              onClick={onCheckUpdate}
              loading={update.checking}
              disabled={update.downloading || update.checking}>
              {update.downloading
                ? t('settings.about.downloading')
                : update.available
                  ? t('settings.about.checkUpdate.available')
                  : t('settings.about.checkUpdate.label')}
            </CheckUpdateButton>
          )} */}
        </AboutHeader>
        {/* 自动更新和测试计划暂时隐藏 */}
        {/* {!isPortable && (
          <>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitle>{t('settings.general.auto_check_update.title')}</SettingRowTitle>
              <Switch value={autoCheckUpdate} onChange={(v) => setAutoCheckUpdate(v)} />
            </SettingRow>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitle>{t('settings.general.test_plan.title')}</SettingRowTitle>
              <Tooltip title={t('settings.general.test_plan.tooltip')} trigger={['hover', 'focus']}>
                <Switch value={testPlan} onChange={(v) => handleSetTestPlan(v)} />
              </Tooltip>
            </SettingRow>
            {testPlan && (
              <>
                <SettingDivider />
                <SettingRow>
                  <SettingRowTitle>{t('settings.general.test_plan.version_options')}</SettingRowTitle>
                  <Radio.Group
                    size="small"
                    buttonStyle="solid"
                    value={getTestChannel()}
                    onChange={(e) => handleTestChannelChange(e.target.value)}>
                    {getAvailableTestChannels().map((option) => (
                      <Tooltip key={option.value} title={option.tooltip}>
                        <Radio.Button value={option.value}>{option.label}</Radio.Button>
                      </Tooltip>
                    ))}
                  </Radio.Group>
                </SettingRow>
              </>
            )}
          </>
        )} */}
      </SettingGroup>
      {/* 发现新版本区域暂时隐藏 */}
      {/* {update.info && update.available && (
        <SettingGroup theme={theme}>
          <SettingRow>
            <SettingRowTitle>
              {t('settings.about.updateAvailable', { version: update.info.version })}
              <IndicatorLight color="green" />
            </SettingRowTitle>
          </SettingRow>
          <UpdateNotesWrapper className="markdown">
            <Markdown>
              {typeof update.info.releaseNotes === 'string'
                ? update.info.releaseNotes.replace(/\n/g, '\n\n')
                : update.info.releaseNotes?.map((note) => note.note).join('\n')}
            </Markdown>
          </UpdateNotesWrapper>
        </SettingGroup>
      )} */}
      {/* 帮助文档、更新日志等暂时隐藏 */}
      {/* <SettingGroup theme={theme}>
        <SettingRow>
          <SettingRowTitle>
            <BadgeQuestionMark size={18} />
            {t('docs.title')}
          </SettingRowTitle>
          <Button onClick={onOpenDocs}>{t('settings.about.website.button')}</Button>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            <Rss size={18} />
            {t('settings.about.releases.title')}
          </SettingRowTitle>
          <Button onClick={showReleases}>{t('settings.about.releases.button')}</Button>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            <Globe size={18} />
            {t('settings.about.website.title')}
          </SettingRowTitle>
          <Button onClick={() => onOpenWebsite('https://cherry-ai.com')}>{t('settings.about.website.button')}</Button>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            <Github size={18} />
            {t('settings.about.feedback.title')}
          </SettingRowTitle>
          <Button onClick={() => onOpenWebsite('https://github.com/CherryHQ/cherry-studio/issues/new/choose')}>
            {t('settings.about.feedback.button')}
          </Button>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            <Building2 size={18} />
            {t('settings.about.enterprise.title')}
          </SettingRowTitle>
          <Button onClick={showEnterprise}>{t('settings.about.website.button')}</Button>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            <Mail size={18} />
            {t('settings.about.contact.title')}
          </SettingRowTitle>
          <Button onClick={mailto}>{t('settings.about.contact.button')}</Button>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            <Bug size={18} />
            {t('settings.about.debug.title')}
          </SettingRowTitle>
          <Button onClick={debug}>{t('settings.about.debug.open')}</Button>
        </SettingRow>
      </SettingGroup> */}
    </SettingContainer>
  )
}

const AboutHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 5px 0;
`

const VersionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 80px;
  justify-content: center;
  align-items: flex-start;
`

const Title = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text-1);
  margin-bottom: 5px;
`

const Description = styled.div`
  font-size: 14px;
  color: var(--color-text-2);
  text-align: center;
`

const AvatarWrapper = styled.div`
  position: relative;
  cursor: pointer;
  margin-right: 15px;
`

const ProgressCircle = styled(Progress)`
  position: absolute;
  top: -2px;
  left: -2px;
`

export const SettingRowTitle = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-1);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  .anticon {
    font-size: 16px;
    color: var(--color-text-1);
  }
`

export default AboutSettings
