// eslint-disable-next-line no-alert, no-undef
alert("Webpack is started. Check console");

fetch("/testResponseFromJsonFile")
  .then(response => response.json())
  .then(data => console.log(data));
