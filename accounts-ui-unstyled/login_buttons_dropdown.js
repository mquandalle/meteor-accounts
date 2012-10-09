(function () {
  // for convenience
  var loginButtonsSession = Accounts._loginButtonsSession;

  // events shared between loginButtonsLoggedOutDropdown and
  // loginButtonsLoggedInDropdown
  Template.loginButtons.events({
    'click #login-name-link, click #login-sign-in-link': function () {
      loginButtonsSession.set('dropdownVisible', true);
      Meteor.flush();
      correctDropdownZIndexes();
    },
    'click .login-close-text': function () {
      loginButtonsSession.closeDropdown();
    }
  });


  //
  // loginButtonsLoggedInDropdown template and related
  //

  Template.loginButtonsLoggedInDropdown.events({
    'click #login-buttons-open-change-password': function() {
      loginButtonsSession.resetMessages();
      loginButtonsSession.set('inChangePasswordFlow', true);
    }
  });

  Template.loginButtonsLoggedInDropdown.displayName = function () {
    return Accounts._loginButtons.displayName();
  };

  Template.loginButtonsLoggedInDropdown.inChangePasswordFlow = function () {
    return loginButtonsSession.get('inChangePasswordFlow');
  };

  Template.loginButtonsLoggedInDropdown.dropdownVisible = function () {
    return loginButtonsSession.get('dropdownVisible');
  };

  Template.loginButtonsLoggedInDropdownActions.allowChangingPassword = function () {
    // it would be more correct to check whether the user has a password set,
    // but in order to do that we'd have to send more data down to the client,
    // and it'd be preferable not to send down the entire service.password document.
    //
    // instead we use the heuristic: if the user has a username or email set.
    var user = Meteor.user();
    return user.username || (user.emails && user.emails[0] && user.emails[0].address);
  };


  //
  // loginButtonsLoggedOutDropdown template and related
  //

  Template.loginButtonsLoggedOutDropdown.events({
    'click #login-buttons-password': function () {
      loginOrSignup();
    },

    'keypress #forgot-password-email': function (event) {
      if (event.keyCode === 13)
        forgotPassword();
    },

    'click #login-buttons-forgot-password': function () {
      forgotPassword();
    },

    'click #signup-link': function () {
      loginButtonsSession.resetMessages();

      // store values of fields before swtiching to the signup form
      var username = elementValueById('login-username');
      var email = elementValueById('login-email');
      var usernameOrEmail = elementValueById('login-username-or-email');
      var password = elementValueById('login-password');

      loginButtonsSession.set('inSignupFlow', true);
      loginButtonsSession.set('inForgotPasswordFlow', false);
      // force the ui to update so that we have the approprate fields to fill in
      Meteor.flush();

      // update new fields with appropriate defaults
      if (username !== null)
        document.getElementById('login-username').value = username;
      else if (email !== null)
        document.getElementById('login-email').value = email;
      else if (usernameOrEmail !== null)
        if (usernameOrEmail.indexOf('@') === -1)
          document.getElementById('login-username').value = usernameOrEmail;
      else
        document.getElementById('login-email').value = usernameOrEmail;

      document.getElementById('login-password').value = password;

      // Forge redrawing the `login-dropdown-list` element because of
      // a bizarre Chrome bug in which part of the DIV is not redrawn
      // in case you had tried to unsuccessfully log in before
      // switching to the signup form.
      //
      // Found tip on how to force a redraw on
      // http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes/3485654#3485654
      var redraw = document.getElementById('login-dropdown-list');
      redraw.style.display = 'none';
      redraw.offsetHeight; // it seems that this line does nothing but is necessary for the redraw to work
      redraw.style.display = 'block';
    },
    'click #forgot-password-link': function () {
      loginButtonsSession.resetMessages();

      // store values of fields before swtiching to the signup form
      var email = elementValueById('login-email');
      var usernameOrEmail = elementValueById('login-username-or-email');

      loginButtonsSession.set('inSignupFlow', false);
      loginButtonsSession.set('inForgotPasswordFlow', true);
      // force the ui to update so that we have the approprate fields to fill in
      Meteor.flush();

      // update new fields with appropriate defaults
      if (email !== null)
        document.getElementById('forgot-password-email').value = email;
      else if (usernameOrEmail !== null)
        if (usernameOrEmail.indexOf('@') !== -1)
          document.getElementById('forgot-password-email').value = usernameOrEmail;

    },
    'keypress #login-username, keypress #login-email, keypress #login-username-or-email, keypress #login-password, keypress #login-password-again': function (event) {
      if (event.keyCode === 13)
        loginOrSignup();
    }
  });

  Template.loginButtonsLoggedOutDropdown.dropdownVisible = function () {
    return loginButtonsSession.get('dropdownVisible');
  };

  Template.loginButtonsLoggedOutDropdown.hasPasswordService = function () {
    return Accounts._loginButtons.hasPasswordService();
  };

  Template.loginButtonsLoggedOutAllServices.services = function () {
    return Accounts._loginButtons.getLoginServices();
  };

  Template.loginButtonsLoggedOutAllServices.isPasswordService = function () {
    return this.name === 'password';
  };

  Template.loginButtonsLoggedOutAllServices.hasOtherServices = function () {
    return Accounts._loginButtons.getLoginServices().length > 1;
  };

  Template.loginButtonsLoggedOutAllServices.hasPasswordService = function () {
    return Accounts._loginButtons.hasPasswordService();
  };

  Template.loginButtonsLoggedOutPasswordService.fields = function () {
    var loginFields = [
      {fieldName: 'username-or-email', fieldLabel: 'Username or Email',
       visible: function () {
         return Accounts._options.requireUsername
           && Accounts._options.requireEmail;
       }},
      {fieldName: 'username', fieldLabel: 'Username',
       visible: function () {
         return Accounts._options.requireUsername
           && !Accounts._options.requireEmail;
       }},
      {fieldName: 'email', fieldLabel: 'Email',
       visible: function () {
         return !Accounts._options.requireUsername;
       }},
      {fieldName: 'password', fieldLabel: 'Password', inputType: 'password',
       visible: function () {
         return true;
       }}
    ];

    var signupFields = [
      {fieldName: 'username', fieldLabel: 'Username',
       visible: function () {
         return Accounts._options.requireUsername;
       }},
      {fieldName: 'email', fieldLabel: 'Email',
       visible: function () {
         return !Accounts._options.requireUsername
           || Accounts._options.requireEmail;
       }},
      {fieldName: 'password', fieldLabel: 'Password', inputType: 'password',
       visible: function () {
         return true;
       }},
      {fieldName: 'password-again', fieldLabel: 'Password (again)',
       inputType: 'password',
       visible: function () {
         return Accounts._options.requireUsername
           && !Accounts._options.requireEmail;
       }}
    ];

    return loginButtonsSession.get('inSignupFlow') ? signupFields : loginFields;
  };

  Template.loginButtonsLoggedOutPasswordService.inForgotPasswordFlow = function () {
    return loginButtonsSession.get('inForgotPasswordFlow');
  };

  Template.loginButtonsLoggedOutPasswordService.inLoginFlow = function () {
    return !loginButtonsSession.get('inSignupFlow') && !loginButtonsSession.get('inForgotPasswordFlow');
  };

  Template.loginButtonsLoggedOutPasswordService.inSignupFlow = function () {
    return loginButtonsSession.get('inSignupFlow');
  };

  Template.loginButtonsLoggedOutPasswordService.showForgotPasswordLink = function () {
    return Accounts._options.requireEmail
      || !Accounts._options.requireUsername;
  };


  //
  // loginButtonsChangePassword template
  //

  Template.loginButtonsChangePassword.events({
    'keypress #login-old-password, keypress #login-password, keypress #login-password-again': function (event) {
      if (event.keyCode === 13)
        changePassword();
    },
    'click #login-buttons-do-change-password': function () {
      changePassword();
    }
  });

  Template.loginButtonsChangePassword.fields = function () {
    return [
      {fieldName: 'old-password', fieldLabel: 'Current Password', inputType: 'password',
       visible: function () {
         return true;
       }},
      {fieldName: 'password', fieldLabel: 'New Password', inputType: 'password',
       visible: function () {
         return true;
       }},
      {fieldName: 'password-again', fieldLabel: 'New Password (again)',
       inputType: 'password',
       visible: function () {
         return Meteor.accounts._options.requireUsername
           && !Meteor.accounts._options.requireEmail;
       }}
    ];
  };


  //
  // helpers
  //

  var elementValueById = function(id) {
    var element = document.getElementById(id);
    if (!element)
      return null;
    else
      return element.value;
  };

  var loginOrSignup = function () {
    if (loginButtonsSession.get('inSignupFlow'))
      signup();
    else
      login();
  };

  var login = function () {
    loginButtonsSession.resetMessages();

    var username = elementValueById('login-username');
    var email = elementValueById('login-email');
    var usernameOrEmail = elementValueById('login-username-or-email');
    var password = elementValueById('login-password');

    var loginSelector;
    if (username !== null)
      loginSelector = {username: username};
    else if (email !== null)
      loginSelector = {email: email};
    else if (usernameOrEmail !== null)
      loginSelector = usernameOrEmail;
    else
      throw new Error("Unexpected -- no element to use as a login user selector");

    Meteor.loginWithPassword(loginSelector, password, function (error, result) {
      if (error) {
        loginButtonsSession.set('errorMessage', error.reason || "Unknown error");
      } else {
        loginButtonsSession.closeDropdown();
      }
    });
  };

  var signup = function () {
    loginButtonsSession.resetMessages();

    var options = {}; // to be passed to Meteor.createUser

    var username = elementValueById('login-username');
    if (username !== null) {
      if (!Accounts._loginButtons.validateUsername(username))
        return;
      else
        options.username = username;
    }

    var email = elementValueById('login-email');
    if (email !== null) {
      if (!Accounts._loginButtons.validateEmail(email))
        return;
      else
        options.email = email;
    }

    var password = elementValueById('login-password');
    if (!Accounts._loginButtons.validatePassword(password))
      return;
    else
      options.password = password;

    if (!matchPasswordAgainIfPresent())
      return;

    if (Accounts._options.validateEmails)
      options.validation = true;

    Accounts.createUser(options, function (error) {
      if (error) {
        loginButtonsSession.set('errorMessage', error.reason || "Unknown error");
      } else {
        loginButtonsSession.closeDropdown();
      }
    });
  };

  var forgotPassword = function () {
    loginButtonsSession.resetMessages();

    var email = document.getElementById("forgot-password-email").value;
    if (email.indexOf('@') !== -1) {
      Accounts.forgotPassword({email: email}, function (error) {
        if (error)
          loginButtonsSession.set('errorMessage', error.reason || "Unknown error");
        else
          loginButtonsSession.set('infoMessage', "Email sent");
      });
    } else {
      loginButtonsSession.set('errorMessage', "Invalid email");
    }
  };

  var changePassword = function () {
    loginButtonsSession.resetMessages();

    var oldPassword = elementValueById('login-old-password');

    var password = elementValueById('login-password');
    if (!Accounts._loginButtons.validatePassword(password))
      return;

    if (!matchPasswordAgainIfPresent())
      return;

    Accounts.changePassword(oldPassword, password, function (error) {
      if (error) {
        loginButtonsSession.set('errorMessage', error.reason || "Unknown error");
      } else {
        loginButtonsSession.set('infoMessage', "Password changed");
      }
    });
  };

  var matchPasswordAgainIfPresent = function () {
    var passwordAgain = elementValueById('login-password-again');
    if (passwordAgain !== null) {
      var password = elementValueById('login-password');
      if (password !== passwordAgain) {
        loginButtonsSession.set('errorMessage', "Passwords don't match");
        return false;
      }
    }
    return true;
  };

  var correctDropdownZIndexes = function () {
    // IE <= 7 has a z-index bug that means we can't just give the
    // dropdown a z-index and expect it to stack above the rest of
    // the page even if nothing else has a z-index.  The nature of
    // the bug is that all positioned elements are considered to
    // have z-index:0 (not auto) and therefore start new stacking
    // contexts, with ties broken by page order.
    //
    // The fix, then is to give z-index:1 to all ancestors
    // of the dropdown having z-index:0.
    for(var n = document.getElementById('login-dropdown-list').parentNode;
        n.nodeName !== 'BODY';
        n = n.parentNode)
      if (n.style.zIndex === 0)
        n.style.zIndex = 1;
  };


}) ();