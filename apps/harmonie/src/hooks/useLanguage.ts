import i18n from '../i18n'

export const useLanguage = () => {
  const currentLang = i18n.language.startsWith('en') ? 'En' : 'Fr'

  const toggleLang = () =>
    i18n.changeLanguage(i18n.language.startsWith('en') ? 'fr' : 'en')

  return { currentLang, toggleLang }
}
