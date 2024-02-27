function emailValidate() {
  const emailId = document.getElementById("email").value.trim();

  const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const validTLDs = [".com", ".net", ".org"];

  if (
    !emailPattern.test(emailId) ||
    !validTLDs.some((tld) => emailId.endsWith(tld))
  ) {
    alert("Please enter a valid email address with a valid domain.");

    return false;
  }

  return true;
}

function numberValidate() {
  const phoneNumber = document.getElementById("number").value.trim();
  //   alert("number: " + phoneNumber);

  // Check if the phoneNumber is a 10-digit number
  const numberPattern = /^\d{10}$/;

  if (!numberPattern.test(phoneNumber)) {
    alert("Please enter a valid 10-digit phone number.");
    return false;
  }

  return true;
}

function passwordValidate() {
  const password = document.getElementById("password").value.trim();

  if (password.length < 8) {
    alert("Please enter a password that is at least 8 characters long.");
    return false;
  }

  return true;
}

function validate() {
  if (emailValidate() && numberValidate() && passwordValidate()) {
    return true;
  } else {
    return false;
  }
}
