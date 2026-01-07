import { useTheme } from '@renderer/context/ThemeProvider'
import { Input, Modal } from 'antd'
import type { ModalProps } from 'antd'
import type { FC, ReactNode } from 'react'
import styled from 'styled-components'

// ==================== StyledModal ====================
interface StyledModalProps extends ModalProps {
  children?: ReactNode
}

export const StyledModal: FC<StyledModalProps> = ({ children, ...props }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <ModalWrapper $isDark={isDark} {...props}>
      {children}
    </ModalWrapper>
  )
}

const ModalWrapper = styled(Modal)<{ $isDark: boolean }>`
  .ant-modal-content {
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
    background: ${({ $isDark }) => ($isDark ? '#1a1a2e' : '#ffffff')};
    box-shadow: ${({ $isDark }) =>
      $isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.12)'};
  }

  .ant-modal-header {
    border-bottom: none;
    padding: 20px 24px 8px;
    background: transparent;
  }

  .ant-modal-title {
    font-size: 18px;
    font-weight: 600;
    color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  }

  .ant-modal-close {
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;

    &:hover {
      background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')};
    }
  }

  .ant-modal-body {
    padding: 12px 24px 24px;
  }

  .ant-modal-footer {
    border-top: none;
    padding: 0 24px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .ant-btn {
      height: 36px;
      padding: 0 20px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .ant-btn-default {
      background: transparent;
      border: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb')};
      color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};

      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }
    }

    .ant-btn-primary {
      background: #3b82f6;
      border: none;

      &:hover {
        background: #2563eb;
      }
    }
  }
`

// ==================== Form Components ====================
export const FormGroup = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`

export const FormLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
`

export const FormHint = styled.div`
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 6px;
`

export const FormInput = styled(Input)`
  border-radius: 8px;
  height: 38px;

  &:focus,
  &:hover {
    border-color: #3b82f6;
  }

  &:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`

export const FormTextArea = styled(Input.TextArea)`
  border-radius: 8px;

  &:focus,
  &:hover {
    border-color: #3b82f6;
  }

  &:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`

export const FormRow = styled.div`
  display: flex;
  gap: 16px;

  > * {
    flex: 1;
  }
`

// ==================== Button Styles ====================
export const PrimaryButton = styled.button`
  height: 36px;
  padding: 0 20px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const SecondaryButton = styled.button<{ $isDark?: boolean }>`
  height: 36px;
  padding: 0 20px;
  border-radius: 8px;
  border: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb')};
  background: transparent;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export default StyledModal
