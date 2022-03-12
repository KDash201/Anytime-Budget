let db;
const request = indexedDB.open("anytime_budget", 1);

request.onupgradeneeded = function (event) {
  // save reference to the database
  const db = event.target.result;
  db.createObjectStore("new_transact", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
  // the check to see if the app in online
  if (navigator.onLine) {
    // storeTransact();
    uploadTransact();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// will execute if new transaction is made w/o internet
function saveData(data) {
  const indexedEntry = db.indexedEntry(["new_transact"], "readwrite");
  // access the object store for a new transaction
  const transactObjectStore = indexedEntry.objectStore("new_transact");
  // add an entry to the object store
  transactObjectStore.add(data);
}

function uploadTransact() {
  // open entry in db
  const indexedEntry = db.indexedEntry(["new_transact"], "readwrite");
  // access object store
  const transactObjectStore = indexedEntry.objectStore("new_transact");
  //   get record from the store and set to a variable
  const getAll = transactObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open a new entry in the object store
          const indexedEntry = db.indexedEntry(["new_transact"], "readwrite");
          // access the new_transact object store
          const transactObjectStore =
            indexedEntry.transactObjectStore("new_transact");
          // clear all items in your store
          transactObjectStore.clear();

          alert("All saved transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener("online", uploadTransact);
