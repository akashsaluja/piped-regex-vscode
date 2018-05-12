# piped-regex README

The extension provides a clean way to have piped search (multiple filters one over another) and subsequently replace functionality. It supports regular Expressions.

## Features

1. Supports find and replace in the file on the current editor.
2. Supports regex for find and replace.
3. Supports piped(recursive) operation.

## Usability

Open Command Pallete, and search for `Piped Regex`. You can then write the query.

The query is of following form:

One or Multiple`f{space}"{regex}"` followed by `{space}r{space}{regex}`

Examples:

`f "tajmahal" f "mahal"` -- It will search the text for `mahal` wherever it appeared with `tajmahal`
`f "tajmahal" f "mahal" r "Palace"` -- It will replace the mahal which occurred with `tajmahal` making it finally `tajPalace`
`f "\$\d+" f "\d+" r "100"` -- It will replace every figure which is preceded by $ and change the currency to 100.


## Extension Settings

Nothing as of now.

**Enjoy!**
