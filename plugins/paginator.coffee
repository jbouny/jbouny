
module.exports = (env, callback) ->
  ### Paginator plugin. Defaults can be overridden in config.json
      e.g. "paginator": {"perPage": 10} ###

  defaults =
    template: 'index.jade' # template that renders pages
    first: 'index.html' # filename/url for first page
    filename: 'page/%d/index.html' # filename for rest of pages
    perPage: 2 # number of articles per page

  # assign defaults any option not set in the config file
  options = env.config.paginator or {}
  for key, value of defaults
    options[key] ?= defaults[key]
    
  orderByFileName = (array) ->
    return array.sort (a, b) -> b.filename < a.filename
    
  orderByFileNameDesc = (array) ->
    return array.sort (a, b) -> b.filename > a.filename

  getArticles = (contents) ->
    # helper that returns a list of articles found in *contents*
    # note that each article is assumed to have its own directory in the articles directory
    folder = contents.en['articles']
    articles = folder._.directories.map (item) -> item.index
    # skip articles that does not have a template associated
    articles = articles.filter (item) -> item.template isnt 'none'
    # sort article by date
    articles = articles.sort (a, b) -> b.date - a.date

  getHeaders = (contents) ->
    pages = []
    for key, value of env.i18nContents(contents)['headers-index']
      pages.push value if value instanceof env.plugins.Page
    return orderByFileName(pages)

  getProjects = (contents) ->
    pages = []
    for key, value of env.i18nContents(contents)['projects']
      pages.push value if value instanceof env.plugins.Page
    return orderByFileNameDesc(pages)

  getExperiences = (contents) ->
    pages = []
    for key, value of env.i18nContents(contents)['experiences']
      pages.push value if value instanceof env.plugins.Page
    return orderByFileName(pages)

  getFormations = (contents) ->
    pages = []
    for key, value of env.i18nContents(contents)['formations']
      pages.push value
    return orderByFileName(pages)
    
  getFooter = (contents) ->
    return contents['footer.md']
    
  getSkills = (contents) ->
    return env.i18nContents(contents)['skills.json']
    
  getKeywords = (contents) ->
    return env.i18nContents(contents)['keywords.json']
    
  getCarousels = (contents) ->
    pages = []
    for key, value of env.i18nContents(contents)['carousel-index']
      pages.push value if value instanceof env.plugins.Page
    return orderByFileName(pages)

  class PaginatorPage extends env.plugins.Page
    ### A page has a number and a list of articles ###

    constructor: (@pageNum, @articles) ->

    getFilename: ->
      if @pageNum is 1
        options.first
      else
        options.filename.replace '%d', @pageNum

    getView: -> (env, locals, contents, templates, callback) ->
      # simple view to pass articles and pagenum to the paginator template
      # note that this function returns a funciton

      # get the pagination template
      template = templates[options.template]
      if not template?
        return callback new Error "unknown paginator template '#{ options.template }'"

      # setup the template context
      ctx = {@articles, @pageNum, @prevPage, @nextPage}

      # extend the template context with the enviroment locals
      env.utils.extend ctx, locals

      # finally render the template
      template.render ctx, callback

  # register a generator, 'paginator' here is the content group generated content will belong to
  # i.e. contents._.paginator
  env.registerGenerator 'paginator', (contents, callback) ->

    # find all articles
    articles = getArticles contents

    # populate pages
    numPages = Math.ceil articles.length / options.perPage
    pages = []
    for i in [0...numPages]
      pageArticles = articles.slice i * options.perPage, (i + 1) * options.perPage
      pages.push new PaginatorPage i + 1, pageArticles

    # add references to prev/next to each page
    for page, i in pages
      page.prevPage = pages[i - 1]
      page.nextPage = pages[i + 1]

    # create the object that will be merged with the content tree (contents)
    # do _not_ modify the tree directly inside a generator, consider it read-only
    rv = {pages:{}}
    for page in pages
      rv.pages["#{ page.pageNum }.page"] = page # file extension is arbitrary
    rv['index.page'] = pages[0] # alias for first page
    rv['last.page'] = pages[(numPages-1)] # alias for last page

    # callback with the generated contents
    callback null, rv

  # add the article helper to the environment so we can use it later
  env.helpers.getArticles = getArticles
  env.helpers.getHeaders = getHeaders
  env.helpers.getProjects = getProjects
  env.helpers.getExperiences = getExperiences
  env.helpers.getFormations = getFormations
  env.helpers.getFooter = getFooter
  env.helpers.getSkills = getSkills
  env.helpers.getKeywords = getKeywords
  env.helpers.getCarousels = getCarousels

  # tell the plugin manager we are done
  callback()
