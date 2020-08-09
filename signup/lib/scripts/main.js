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

auth.signOut().catch(err => errorAlert(err.message));

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

    var fields = document.querySelectorAll("form div input");
    var inputs = Array.from(fields).map(field => field.value.trim());
    if (inputs.filter(input => input.length == 0).length > 0) 
        errorAlert("Not all the input fields are filled.");
    else {
        // if all fields are filled
        auth.createUserWithEmailAndPassword(inputs[2], inputs[3])
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
        .then(() => {
            auth.signOut()
            .then(() => {
                document.querySelector(".signup").style.display = "none";
                document.querySelector(".success").style.display = "block";
            }).catch(err => errorAlert(err.message));
        })
        .catch(err => errorAlert(err.message));
    }
}