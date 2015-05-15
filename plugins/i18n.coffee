module.exports = (env, callback) ->
  lang_FR = [
    'LAB_DESC'            : 'Portail professionnel de Jérémy BOUNY',
    'LAB_KEYWORDS'        : 'Mots clés',
    'LAB_DEMOS'           : 'Démos & Projets',
    'LAB_MORE'            : 'Voir plus',
    'LAB_HOME'            : 'Accueil',
    'LAB_EXPERIENCES'     : 'Expériences',
    'LAB_COMPETENCES'     : 'Compétences',
    'LAB_FORMATIONS'      : 'Formations',
    'LAB_BLOG'            : 'Blog',
    'LAB_CONTACT'         : 'Contact',
    'LAB_EXPERIENCES_PRO' : 'Expériences professionnelles',
    'LAB_TOGGLE'          : 'Afficher/cacher le menu',
    'LAB_LASTARTICLE'     : 'Dernier article',
    
    'DESC_POSTE'          : 'Ingénieur R&D à Catopsys, Clermont-Ferrand',
    'EXP_GITHUB'          : 'L’ensemble de ces démos sont a retrouver directement sur '
  ]
  lang_EN = [
    'LAB_DESC'            : 'Professional portal of Jérémy BOUNY',
    'LAB_KEYWORDS'        : 'Keywords',
    'LAB_DEMOS'           : 'Demos & Projects',
    'LAB_MORE'            : 'More',
    'LAB_HOME'            : 'Home',
    'LAB_EXPERIENCES'     : 'Experiences',
    'LAB_COMPETENCES'     : 'Skills',
    'LAB_FORMATIONS'      : 'Education',
    'LAB_BLOG'            : 'Blog',
    'LAB_CONTACT'         : 'Contact',
    'LAB_EXPERIENCES_PRO' : 'Professional experiences',
    'LAB_TOGGLE'          : 'Toggle navigation',
    'LAB_LASTARTICLE'     : 'Last article',
    
    'DESC_POSTE'          : 'R&D Engineer at Catopsys, Clermont-Ferrand, France',
    'EXP_GITHUB'          : 'All this demos can be found on '
  ]

  # assign defaults any option not set in the config file
  language = 'fr'
  
  getString = (key) ->
    if language == 'fr'
      return lang_FR[0][key]
    return lang_EN[0][key]
    
  checkLanguage = (page) ->
    if page.url.indexOf('/en/') != -1
      language = 'en'
    else
      language = 'fr'
      
  getRoot = () ->
    if language == 'fr'
      return ''
    else
      return '/en'
    
  getLanguage = () ->
    return language
    
  i18nContents = (contents) ->
    if language == 'fr'
      return contents
    else
      return contents.en
    

  env.helpers.s = getString
  env.helpers.checkLanguage = checkLanguage
  env.helpers.getRoot = getRoot
  env.helpers.getLanguage = getLanguage
  env.i18nContents = i18nContents

  # tell the plugin manager we are done
  callback()
