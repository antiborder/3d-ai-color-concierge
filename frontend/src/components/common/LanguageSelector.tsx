import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const buildTopLangUrl = (langCode: string) => {
    const base = import.meta.env.BASE_URL || '/';
    const url = new URL(base, window.location.origin);
    url.searchParams.set('lang', langCode);
    return url.toString();
  };

  const handleLanguageChange = (langCode: string) => {
    window.location.assign(buildTopLangUrl(langCode));
  };

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
    <Wrapper ref={dropdownRef}>
      <LanguageButton type="button" onClick={() => setIsOpen(!isOpen)}>
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
              <span>{lang.name}</span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
`;

const LanguageButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  width: 84px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  color: #333;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  span:first-child {
    font-size: 14px;
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
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 80px;
  overflow: hidden;
  z-index: 1100;
`;

const DropdownItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  cursor: pointer;
  color: #333;
  background-color: ${(props) => (props.$isActive ? '#f0f0f0' : 'white')};
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  span:first-child {
    font-size: 14px;
  }
`;

export default LanguageSelector;
