import styled from 'styled-components'

export const WindowControlsContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  height: var(--navbar-height);
  -webkit-app-region: no-drag;
  user-select: none;
  z-index: 9999;
`

export const ControlButton = styled.button<{ $isClose?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: var(--navbar-height);
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  outline: none;
  transition:
    background 0.15s,
    color 0.15s;
  padding: 0;
  position: relative;
  border-radius: 0;

  &:hover {
    background: ${(props) => (props.$isClose ? '#e81123' : 'rgba(59, 130, 246, 0.15)')};
    color: ${(props) => (props.$isClose ? '#ffffff' : '#3b82f6')};
  }

  &:active {
    background: ${(props) => (props.$isClose ? '#c50e1f' : 'rgba(59, 130, 246, 0.25)')};
    color: ${(props) => (props.$isClose ? '#ffffff' : '#3b82f6')};
  }

  svg {
    pointer-events: none;
  }
`
