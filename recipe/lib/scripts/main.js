firebase.initializeApp({
    apiKey: "AIzaSyDGUvCzXt5Xd6HSHJ9-rCN_deEPD0BxILw",
    authDomain: "demoday-83180.firebaseapp.com",
    databaseURL: "https://demoday-83180.firebaseio.com",
    projectId: "demoday-83180",
    storageBucket: "demoday-83180.appspot.com",
    messagingSenderId: "655039030434",
    appId: "1:655039030434:web:b788265f1617bdf075a3fb"
});

const database = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// Error
window.onclick = function() {
    var errorBox = document.querySelector(".error-box");
    if (event.target == errorBox) errorBox.style.display = "none";
};

document.querySelector(".error-content div").onclick = function() {
    document.querySelector(".error-box").style.display = "none";
}

var errorAlert = (msg = "Error Message.") => {
    document.querySelector(".error-box").style.display = "grid";
    document.querySelector(".error-msg").innerHTML = msg;
};



// Logged In Logistics
auth.onAuthStateChanged(user => {
    if (!user) {
        // User is not signed in.
        document.querySelector(".recipe-form").style.display = "none";
        document.querySelector(".login").style.display = "block";
    } else {
        // User is signed in.
        console.log(user);
        loadForm();
    }
});


// Form
function loadForm() {
    initSection("ingredient");
    initSection("instruction");
}

function initSection(id) {
    var box = document.querySelector(`.${id}s-box`);
    box.innerHTML = "";

    function addInput() {
        if (document.querySelectorAll(`.${id}s-box div p`).length > 0) box.innerHTML = "";
        box.appendChild(newIngredientInput());
    }
    document.getElementById(`${id}Btn`).onclick = function() {
        event.preventDefault();
        addInput();
    };
    addInput();
}

function newInput(label, type, ...add) {
    var l = document.createElement("label");
    l.innerHTML = label;

    var i = document.createElement("input");
    i.setAttribute("type", type);
    if (type !== "text") for (key in add[0]) i.setAttribute(key, add[0][key]);

    var d = document.createElement("div");
    d.appendChild(l);
    d.appendChild(i);

    return d;
}

function newRmvBtn(label = "Parent") {
    var r = document.createElement("button");
    r.innerHTML = `Remove ${label}`;
    r.onclick = function() {
        event.preventDefault();
        var parent = r.parentNode,
            grandparent = parent.parentNode;

        grandparent.removeChild(parent);

        if (grandparent.children.length < 1) {
            var d = document.createElement("div");
            var p = document.createElement("p");
            p.innerHTML = "No item in this section.";

            d.appendChild(p);
            grandparent.appendChild(d);
        }
    };

    return r;
}

function newIngredientInput() {
    var i = document.createElement("div");
    i.appendChild(newInput("Ingredient", "text"));
    i.appendChild(newInput("Quantity", "text"));
    i.appendChild(newRmvBtn("Ingredient"));

    return i;
}

function newStepInput() {
    var i = document.createElement("div");
    i.appendChild(newInput("Step", "text"));
    i.appendChild(newInput("Step Image", "file", {
        accept: "image/png, image/jpeg"
    }));
    i.appendChild(newRmvBtn("Step"));

    return i;
}


// let storageRef = storage.ref("images/wasiagoodmeme.jpg").getDownloadURL().then(result => {
//     console.log(result);
//     let imgEle = document.querySelector("img");
//     imgEle.src = result;
//     imgEle.style.width = "400px";
//     imgEle.style.height = "400px";
//     imgEle.style.backgroundColor = "red";

//     document.body.appendChild(imgEle);
// }).catch(err => alert(err.message));