import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import ColorHistoryPanel from './ColorHistoryPanel';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';

interface HeaderProps {
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  onCssColorsToggle: (enabled: boolean) => void;
  onMaterialColorsToggle: (enabled: boolean) => void;
  onJapaneseColorsToggle: (enabled: boolean) => void;
  colorHistory: ColorHistoryItem[];
  onColorSelect: (r: number, g: number, b: number) => void;
}

const Header = ({
  cssColorsEnabled,
  materialColorsEnabled,
  japaneseColorsEnabled,
  onCssColorsToggle,
  onMaterialColorsToggle,
  onJapaneseColorsToggle,
  colorHistory,
  onColorSelect,
}: HeaderProps) => {
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
      <ColorGroupFilter>
        <FilterTitle>Displayed Colors</FilterTitle>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={cssColorsEnabled}
            onChange={(e) => onCssColorsToggle(e.target.checked)}
          />
          <span>CSS Named Colors</span>
        </CheckboxLabel>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={materialColorsEnabled}
            onChange={(e) => onMaterialColorsToggle(e.target.checked)}
          />
          <span>Material Design Colors</span>
        </CheckboxLabel>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={japaneseColorsEnabled}
            onChange={(e) => onJapaneseColorsToggle(e.target.checked)}
          />
          <span>Japanese Traditional Colors</span>
        </CheckboxLabel>
      </ColorGroupFilter>
      <ColorHistoryPanel history={colorHistory} onColorSelect={onColorSelect} />
    </StyledHeader>
  );
};

const StyledHeader = styled.header`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
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

const ColorGroupFilter = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
`;

const FilterTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  user-select: none;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
  user-select: none;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #4e8cee;
  }

  &:hover {
    color: #000;
  }
`;

export default Header;
