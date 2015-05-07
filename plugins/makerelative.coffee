module.exports = (env, callback) ->
  count = (string, substr) ->
    num = pos = 0
    return 1/0 unless substr.length
    num++ while pos = 1 + string.indexOf(substr, pos)
    num

  env.relative = (source, dest) ->
    return 'index.html' unless dest != '/'
    return dest unless dest.indexOf("/") == 0
    depth = count(source, '/') # 1 being /
    ret = ""
    ret += "../" while depth = depth - 1
    ret + dest.substr(1)

  env.relativeMarkdown = (html) ->
    html = html.replace /\/makerelative\/en\//g, '../'
    html = html.replace /\/makerelative\//g, ''
    return html

  callback()