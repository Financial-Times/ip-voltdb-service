const uniq = require('lodash/uniq');

module.exports = (template) => {
  const pattern = [
    '<%[=-]', // look for opening tag (<%, <%=, or <%-)
    '(?:[\\s])*', // accept any space after opening tag and before identifier
    '(.+?)', // capture the identifier name (`hello` in <%= hello %>)
    '(?:[\\s])*', // accept any space after identifier and before closing tag
    '%>' // look for closing tag
  ].join('');

  const regex = new RegExp(pattern, 'g');
  const matches = [];
  let match;
  /* eslint-disable no-cond-assign */
  while (match = regex.exec(template)) {
    /* eslint-enable
     * no-cond-assign */
    matches.push(match[1]);
  }

  return uniq(matches);
};
