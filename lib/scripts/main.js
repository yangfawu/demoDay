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

$(window).scroll(function() {
    var a = $(this).scrollTop() + $(this).innerHeight();
    $(".effect").each(function() {
        var b = $(this).offset().top;
        if (a > b && $(this).css("opacity") == 0) {
            $(this).css("transform", "none");
            $(this).animate({
                "opacity": 1
            }, 750);
        }
    });
}).scroll();

// Error
window.onclick = function() {
    var errorBox = document.querySelector(".error-box");
    if (event.target == errorBox) errorBox.style.display = "none";
};

document.querySelector(".error-content button").onclick = function() {
    document.querySelector(".error-box").style.display = "none";
}

function errorAlert(msg = "Error Message.") {
    document.querySelector(".error-box").style.display = "grid";
    document.querySelector(".error-msg").innerHTML = msg;
};

function openAuth(type) {
    function getWebsiteHeight() {
        var pageHeight = 0;
        (function findHighestNode(nodesList) {
            for (var i = nodesList.length - 1; i >= 0; i--) {
                if (nodesList[i].scrollHeight && nodesList[i].clientHeight) {
                    var elHeight = Math.max(nodesList[i].scrollHeight, nodesList[i].clientHeight);
                    pageHeight = Math.max(elHeight, pageHeight);
                }
                if (nodesList[i].childNodes.length) findHighestNode(nodesList[i].childNodes);
            }
        })(document.documentElement.childNodes);
        
        return pageHeight;
    }

    var modalContainer = document.createElement("div");
    modalContainer.setAttribute("class", "AUTH-modal-container");
    modalContainer.style.height = `${getWebsiteHeight()}px`;

    window.onclick = function() { 
        if (event.target == modalContainer) modalContainer.remove(); 
        else if (event.target == document.querySelector(".error-box")) document.querySelector(".error-box").remove();
    }
    window.onscroll = window.onresize = function() { modalContainer.style.height = `${getWebsiteHeight()}px`; };
    
    var modal = document.createElement("div");
    modal.setAttribute("class", "AUTH-modal");

    var header = document.createElement("div");
    header.setAttribute("class", "AUTH-modal-header");
    var logo = document.createElement("img");
    logo.setAttribute("src", "assets/recipedia_logo.png");
    var title = document.createElement("h1");
    title.innerHTML = "Recipedia";
    header.appendChild(logo);
    header.appendChild(title);

    // Costumization
    var formTitle = document.createElement("h1");
    formTitle.setAttribute("class", "AUTH-modal-form-title");
    formTitle.innerHTML = ((type == "1") ? "Log In" : "Sign Up");

    function newTextInput(label, ...add) {
        var c = document.createElement("div");
        var l  = document.createElement("label");
        l.innerHTML = label;

        var i = document.createElement("input");
        i.setAttribute("type", ((add[0] == "password") ? "password" : "text"));

        c.appendChild(l);
        c.appendChild(i);

        return c;
    }

    var results = document.createElement("div");
    results.setAttribute("class", "AUTH-modal-form-results");
    results.style.display = "none";

    var resultsP = document.createElement("p");
    resultsP.innerHTML = "You are logged in. Click on this button to log out or click on anywhere outside this box to go back."

    var resultsBtn = document.createElement("button");
    resultsBtn.innerHTML = "Log Out";
    resultsBtn.onclick = function() {
        auth.signOut().then(err => { if (err) errorAlert(err) });
    };

    results.appendChild(resultsP);
    results.appendChild(resultsBtn);

    var form = document.createElement("form");
    form.setAttribute("class", "AUTH-modal-form-FORM");
    if (type == 1) {
        // log in Mode
        form.appendChild(newTextInput("Email"));
        form.appendChild(newTextInput("Password", "password"));

        var sbtBtn = document.createElement("button");
        sbtBtn.innerHTML = "Log In";
        sbtBtn.onclick = function() {
            event.preventDefault();
            var fields = document.querySelectorAll("input");
            var inputs = Array.from(fields).map(input => input.value.trim());

            if (inputs.filter(input => input.length == 0).length > 0) return errorAlert("Not all the input fields are filled.");
            console.log(inputs);
            auth.signInWithEmailAndPassword(inputs[0], inputs[1])
            .catch(err => errorAlert(err.message));

            fields.forEach(field => {
                field.value = "";
            });
        };

        form.appendChild(sbtBtn);
    } else {
        // sign up Mode
        form.appendChild(newTextInput("First Name"));
        form.appendChild(newTextInput("Last Name"));
        form.appendChild(newTextInput("Email"));
        form.appendChild(newTextInput("Confirm Email"));
        form.appendChild(newTextInput("Password", "password"));
        form.appendChild(newTextInput("Confirm Password", "password"));

        var sbtBtn = document.createElement("button");
        sbtBtn.innerHTML = "Sign Up";
        sbtBtn.onclick = function() {
            event.preventDefault();
            var fields = document.querySelectorAll("input");
            var inputs = Array.from(fields).map(input => input.value.trim());

            if (inputs.filter(input => input.length == 0).length > 0) return errorAlert("Not all the input fields are filled.");
            if (inputs[2] !== inputs[3]) return errorAlert("You emails don't match.");
            if (inputs[4] !== inputs[5]) return errorAlert("You passwords don't match.");

            auth.createUserWithEmailAndPassword(inputs[2], inputs[4])
            .then(account => {
                var user = account.user;
                database.ref(`users/${user.uid}`).set({
                    "name": {
                        "first": inputs[0],
                        "last": inputs[1]
                    },
                    "joined": Date.parse(user.metadata.creationTime),
                    "points": { "total": 0 },
                    "recipes": { "total": 0 },
                    "videos": { "total": 0 },
                    "ratings": { "total": 0 }
                });

                fields.forEach(field => {
                    field.value = "";
                });
                return user;
            })
            .then(user => {
                database.ref(`users/${user.uid}/points/history`).push({
                    "date": Date.parse(user.metadata.creationTime),
                    "change": 0,
                    "reason": "User joined."
                });

                var filler = { "id": "NO_SUBMISSION" }
                database.ref(`users/${user.uid}/recipes/submissions`).push(filler);
                database.ref(`users/${user.uid}/videos/submissions`).push(filler);
                database.ref(`users/${user.uid}/ratings/submissions`).push(filler);
            })
            .catch(err => errorAlert(err.message));
        };

        form.appendChild(sbtBtn);
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            form.style.display = "none";
            results.style.display = "block";
        } else {
            form.style.display = "block";
            results.style.display = "none";
        }
    });

    modal.appendChild(header);
    modal.appendChild(formTitle);
    modal.appendChild(results);
    modal.appendChild(form);

    modalContainer.appendChild(modal);
    document.body.append(modalContainer);
}