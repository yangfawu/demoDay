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


// Error
window.onclick = function() {
    var errorBox = document.querySelector(".error-box");
    if (event.target == errorBox) errorBox.style.display = "none";
};

document.querySelector(".error-content div").onclick = function() {
    document.querySelector(".error-box").style.display = "none";
}


// Form
document.querySelector("form button").onclick = function() {
    event.preventDefault();

    var errorAlert = (msg = "Error Message.") => {
        document.querySelector(".error-box").style.display = "grid";
        document.querySelector(".error-msg").innerHTML = msg;
    };

    var inputs = Array.from(document.querySelectorAll("form div input")).map(field => field.value.trim());
    if (inputs.filter(input => input.length == 0).length > 0) 
        errorAlert("Not all the input fields are filled.");
    else {
        // if all fields are filled
        auth.signInWithEmailAndPassword(inputs[0], inputs[1])
        .catch(err => errorAlert(err.message));
    }
}


// Logged In Logistics
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        // User is signed in.
        console.log(user);

        document.querySelector(".login").style.display = "none";
        document.querySelector(".success").style.display = "block";
    } else {
        // User is signed out.
    }
});

document.querySelector(".success button").onclick = function() {
    auth.signOut()
    .then(() => {
        document.querySelector(".login").style.display = "block";
        document.querySelector(".success").style.display = "none";
    }).catch(err => errorAlert(err.message));
}