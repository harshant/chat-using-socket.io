$(document).ready(function() {
    regexp = /^[A-Za-z][a-zA-Z0-9]*$/;
    regexp2 = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
    $("#login").click(function() {
        var username = $("#username").val();
        var password = $("#password").val();
        if (username == '' || password == '') {
            alert("Please fill all fields...!!!!!!");
        } else if ((password.length) < 6 || (password.length) > 128) {
            alert("Password should atleast 6 and max 128 character in length...!!!!!!");
        } else if ((username.length) < 4 || (username.length) > 32) {
            alert("Username should atleast 4 and max 32 character in length...!!!!!!");
        } else if (!regexp.test(username)) {
            alert("First letter should be alphabet and username can contain only numbers, alphabets and underscore ");
        } else if (!regexp2.test(password)) {
            alert("contain only numbers, alphabets and special characters")
        } else {
            $.post("/", {
                username1: username,
                password1: password
            }, function(data) {
                data = JSON.parse(data);
                if (data.login == true) {
                    localStorage.setItem('username', data.user);
                    window.location.href = '/users';
                } else {
                    alert(data.msg);
                }
            });
        }
    });

    $("#signup").click(function() {
        var username = $("#username").val();
        var password = $("#password").val();
        if (username == '' || password == '') {
            alert("Please fill all fields...!!!!!!");
        } else if ((password.length) < 6 || (password.length) > 128) {
            alert("Password should atleast 6 and max 128 character in length...!!!!!!");
        } else if ((username.length) < 4 || (username.length) > 32) {
            alert("Username should atleast 4 and max 32 character in length...!!!!!!");
        } else if (!regexp.test(username)) {
            alert("First letter should be alphabet and username can contain only numbers, alphabets and underscore ");
        } else if (!regexp2.test(password)) {
            alert("contain only numbers, alphabets and special characters")
        } else {
            $.post("/signup", {
                username1: username,
                password1: password
            }, function(data) {
                data = JSON.parse(data);
                if (data.signup == true) {
                    localStorage.setItem('username', data.user);
                    window.location.href = '/users';
                } else {

                    alert(data.msg);
                }
            });
        }
    });
});