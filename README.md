# reero
- Handling http and https requests
- Download:
```javascript
// with npm
npm i reero
// with yarn
yarn add reero
```
- Instructions:
```javascript
const reero = require('reero')
reero('http://example.com').then(response=>{
  console.log(response.headers)
})
```
