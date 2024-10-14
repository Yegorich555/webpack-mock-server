/* eslint-disable no-param-reassign */
// eslint-disable-next-line no-alert, no-undef
alert("Webpack is started. Check console");

fetch("/testResponseFromJsonFile")
  .then((response) => response.json())
  .then((data) => console.log("fetch /testResponseFromJsonFile", data));

async function postData(url = "", body = undefined) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    body, // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

async function apiUploadFile() {
  const urlImg =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
  const blob = await fetch(urlImg).then((res) => res.blob());
  const formData = new FormData();
  formData.append("file", blob, "testFile.png");
  formData.append("valueNumber", 123);
  formData.append("valueBool", true);
  formData.append("valueString", "some test string");
  formData.append("valueArray[0][id]", 101);
  formData.append("valueArray[0][name]", "Kelly");
  formData.append("valueArray[0][isOld]", false);

  formData.append("valueArray[1][id]", 102);
  formData.append("valueArray[1][name]", "Adam");
  formData.append("valueArray[1][isOld]", true);
  formData.append("valueArray[1][DateOfBirth]", new Date(2012, 10, 15).toISOString());

  const res = await postData("/testUploadFile", formData);
  console.log("upload file result: ", res);
}
apiUploadFile();
