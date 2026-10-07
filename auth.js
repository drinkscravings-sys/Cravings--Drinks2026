import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";


// =====================================================
// ELEMENTS
// =====================================================

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword =
    document.getElementById("registerPassword");
const confirmPassword =
    document.getElementById("confirmPassword");

const forgotEmail = document.getElementById("forgotEmail");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const resetPasswordBtn =
    document.getElementById("resetPasswordBtn");

const authMessage = document.getElementById("authMessage");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

const forgotPasswordBtn =
    document.getElementById("forgotPasswordBtn");

const showRegisterBtn =
    document.getElementById("showRegisterBtn");

const showLoginBtn =
    document.getElementById("showLoginBtn");

const showLoginFromForgot =
    document.getElementById("showLoginFromForgot");


// =====================================================
// MESSAGE
// =====================================================

function showMessage(message, type = "error") {

    if (!authMessage) return;

    authMessage.textContent = message;

    authMessage.className = "auth-message";

    if (type === "success") {
        authMessage.classList.add("success");
    } else {
        authMessage.classList.add("error");
    }

}


// =====================================================
// CLEAR MESSAGE
// =====================================================

function clearMessage() {

    if (!authMessage) return;

    authMessage.textContent = "";

    authMessage.className = "auth-message";

}


// =====================================================
// SHOW LOGIN
// =====================================================

function showLogin() {

    clearMessage();

    if (loginForm) {
        loginForm.style.display = "block";
    }

    if (registerForm) {
        registerForm.style.display = "none";
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.style.display = "none";
    }

    if (authTitle) {
        authTitle.textContent = "Welcome Back";
    }

    if (authSubtitle) {
        authSubtitle.textContent =
            "Login to continue to Cravings";
    }

}


// =====================================================
// SHOW REGISTER
// =====================================================

function showRegister() {

    clearMessage();

    if (loginForm) {
        loginForm.style.display = "none";
    }

    if (registerForm) {
        registerForm.style.display = "block";
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.style.display = "none";
    }

    if (authTitle) {
        authTitle.textContent = "Create Account";
    }

    if (authSubtitle) {
        authSubtitle.textContent =
            "Register to start ordering in Cravings";
    }

}


// =====================================================
// SHOW FORGOT PASSWORD
// =====================================================

function showForgotPassword() {

    clearMessage();

    if (loginForm) {
        loginForm.style.display = "none";
    }

    if (registerForm) {
        registerForm.style.display = "none";
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.style.display = "block";
    }

    if (authTitle) {
        authTitle.textContent = "Reset Password";
    }

    if (authSubtitle) {
        authSubtitle.textContent =
            "Enter your email to receive a password reset link";
    }

}


// =====================================================
// BUTTON EVENTS
// =====================================================

if (showRegisterBtn) {

    showRegisterBtn.addEventListener(
        "click",
        showRegister
    );

}


if (showLoginBtn) {

    showLoginBtn.addEventListener(
        "click",
        showLogin
    );

}


if (forgotPasswordBtn) {

    forgotPasswordBtn.addEventListener(
        "click",
        showForgotPassword
    );

}


if (showLoginFromForgot) {

    showLoginFromForgot.addEventListener(
        "click",
        showLogin
    );

}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage();

            const email =
                loginEmail.value.trim();

            const password =
                loginPassword.value;


            if (!email || !password) {

                showMessage(
                    "Please enter email and password."
                );

                return;
            }


            loginBtn.disabled = true;

            loginBtn.textContent = "Logging in...";


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                showMessage(
                    "Login successful. Opening website...",
                    "success"
                );


                setTimeout(() => {

                    window.location.replace(
                        "home.html"
                    );

                }, 500);


            } catch (error) {

                console.error(error);

                showMessage(
                    getFirebaseErrorMessage(error)
                );

            } finally {

                loginBtn.disabled = false;

                loginBtn.textContent = "Login";

            }

        }
    );

}


// =====================================================
// REGISTER
// =====================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage();


            const name =
                registerName.value.trim();

            const email =
                registerEmail.value.trim();

            const password =
                registerPassword.value;

            const confirm =
                confirmPassword.value;


            if (!name) {

                showMessage(
                    "Please enter your name."
                );

                return;
            }


            if (!email) {

                showMessage(
                    "Please enter your email."
                );

                return;
            }


            if (password.length < 6) {

                showMessage(
                    "Password must contain at least 6 characters."
                );

                return;
            }


            if (password !== confirm) {

                showMessage(
                    "Passwords do not match."
                );

                return;
            }


            registerBtn.disabled = true;

            registerBtn.textContent =
                "Creating Account...";


            try {

                // Create Firebase account
                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                // Save user's display name
                await updateProfile(
                    user,
                    {
                        displayName: name
                    }
                );


                // Create user document
                await setDoc(
                    doc(db, "users", user.uid),
                    {

                        uid: user.uid,

                        name: name,

                        email: email,

                        role: "customer",

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );


                showMessage(
                    "Registration successful. Opening website...",
                    "success"
                );


                // Firebase automatically logs
                // the newly registered user in.
                setTimeout(() => {

                    window.location.replace(
                        "home.html"
                    );

                }, 700);


            } catch (error) {

                console.error(error);

                showMessage(
                    getFirebaseErrorMessage(error)
                );

            } finally {

                registerBtn.disabled = false;

                registerBtn.textContent =
                    "Create Account";

            }

        }
    );

}


// =====================================================
// FORGOT PASSWORD
// =====================================================

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage();


            const email =
                forgotEmail.value.trim();


            if (!email) {

                showMessage(
                    "Please enter your email address."
                );

                return;
            }


            resetPasswordBtn.disabled = true;

            resetPasswordBtn.textContent =
                "Sending...";


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                showMessage(
                    "Password reset link sent to your email.",
                    "success"
                );


                forgotPasswordForm.reset();


            } catch (error) {

                console.error(error);

                showMessage(
                    getFirebaseErrorMessage(error)
                );

            } finally {

                resetPasswordBtn.disabled = false;

                resetPasswordBtn.textContent =
                    "Send Reset Link";

            }

        }
    );

}


// =====================================================
// ALREADY LOGGED-IN USER
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            // User is already logged in.
            // Don't keep them on the login page.

            window.location.replace(
                "home.html"
            );

        }

    }
);


// =====================================================
// LOGOUT FUNCTION
// =====================================================

window.logoutUser = async function () {

    try {

        const {
            signOut
        } = await import(
            "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js"
        );

        await signOut(auth);

        window.location.replace(
            "index.html"
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

};


// =====================================================
// FIREBASE ERROR MESSAGES
// =====================================================

function getFirebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/invalid-email":

            return "Please enter a valid email address.";

        case "auth/user-not-found":

            return "No account found with this email.";

        case "auth/wrong-password":

            return "Incorrect password.";

        case "auth/invalid-credential":

            return "Invalid email or password.";

        case "auth/email-already-in-use":

            return "An account already exists with this email.";

        case "auth/weak-password":

            return "Password must contain at least 6 characters.";

        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";

        case "auth/network-request-failed":

            return "Network error. Please check your internet connection.";

        default:

            return error.message ||
                "Something went wrong. Please try again.";

    }

}