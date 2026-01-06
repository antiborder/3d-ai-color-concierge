import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const Header = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <StyledHeader>
      <LanguageSelector ref={dropdownRef}>
        <LanguageButton onClick={() => setIsOpen(!isOpen)}>
          <span>{currentLanguage.flag}</span>
          <span>{currentLanguage.name}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </LanguageButton>
        {isOpen && (
          <DropdownMenu>
            {languages.map((lang) => (
              <DropdownItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                $isActive={i18n.language === lang.code}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </DropdownItem>
            ))}
          </DropdownMenu>
        )}
      </LanguageSelector>
    </StyledHeader>
  );
};

const StyledHeader = styled.header`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  padding: 12px 20px;
`;

const LanguageSelector = styled.div`
  position: relative;
`;

const LanguageButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  span:first-child {
    font-size: 18px;
  }

  span:last-child {
    font-size: 10px;
    margin-left: 4px;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  overflow: hidden;
`;

const DropdownItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  background-color: ${(props) => (props.$isActive ? '#f0f0f0' : 'white')};
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  span:first-child {
    font-size: 18px;
  }
`;

export default Header;
