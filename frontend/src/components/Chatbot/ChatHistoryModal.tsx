/**
 * チャット履歴モーダルコンポーネント
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { ConversationMessage } from '@/types/voice';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationHistory: ConversationMessage[];
  onClearHistory: () => void;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  conversationHistory,
  onClearHistory,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{t('chatbot.history.title', 'Chat History')}</ModalTitle>
          <HeaderButtons>
            <ClearButton onClick={onClearHistory} disabled={conversationHistory.length === 0}>
              {t('chatbot.history.clear', 'Clear')}
            </ClearButton>
            <CloseButton onClick={onClose}>×</CloseButton>
          </HeaderButtons>
        </ModalHeader>
        <MessageList>
          {conversationHistory.length === 0 ? (
            <EmptyMessage>
              {t('chatbot.history.empty', 'No conversation history yet.')}
            </EmptyMessage>
          ) : (
            conversationHistory.map((message, index) => (
              <MessageItem key={index} $role={message.role}>
                <MessageBubble $role={message.role}>
                  <MessageContent>{message.content}</MessageContent>
                </MessageBubble>
              </MessageItem>
            ))
          )}
        </MessageList>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ClearButton = styled.button`
  padding: 6px 12px;
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #e0e0e0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: #666;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageItem = styled.div<{ $role: 'user' | 'assistant' }>`
  display: flex;
  justify-content: ${(props) => (props.$role === 'user' ? 'flex-end' : 'flex-start')};
`;

const MessageBubble = styled.div<{ $role: 'user' | 'assistant' }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  background-color: ${(props) => (props.$role === 'user' ? '#4e8cee' : '#f0f0f0')};
  color: ${(props) => (props.$role === 'user' ? 'white' : '#333')};
  word-wrap: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const MessageContent = styled.div`
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 40px 20px;
`;

export default ChatHistoryModal;
