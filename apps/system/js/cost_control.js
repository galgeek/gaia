/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var CostControl = {

  //Constants. Should we get it from variant? Issue 4
  CHECK_BALANCE_NUMBER: '8000',
  CHECK_BALANCE_TEXT: '',
  TOP_UP_NUMBER: '8000',
  TOP_UP_PREV_TEXT: '',
  TOP_UP_FOLL_TEXT: '',

  init: function cc_init() {
    console.log('---- Cost control init -----');
    //For USSD (TopUp)
    if (navigator.mozMobileConnection) {
      this.conn = navigator.mozMobileConnection;
      this.conn.addEventListener('ussdreceived', this);
    }
    //For SMS (Cost)
    if (navigator.mozSms) {
      this.sms = navigator.mozSms;
      this.sms.addEventListener('sent', this);
    }
    //For calls
    if (navigator.mozTelephony) {
      this.telephony = navigator.mozTelephony;
      this.telephony.addEventListener('callschanged', this);
    }

    //Show the saved balance while we update it
    this.feedback = new Array(document.getElementById('cost-control-date'),
                             document.getElementById('cost-control-container'));
    this.getInitialBalance();

    //Listener for check now button
    this.checkNowBalanceButton = document.getElementById('cost-control-check-balance');
    this.checkNowBalanceButton.addEventListener('click', (function() {
      this.updateBalance();
    }).bind(this));

    //Listener for Top up button
    this.topUpButton = document.getElementById('cost-control-topup');
    this.topUpButton.addEventListener('click', (function() {
      this.topUp();
    }).bind(this));
  },

  handleEvent: function cc_handleEvent(evt) {
    console.log('Evento escuchado: ' + evt.type);
    switch (evt.type) {
      case 'ussdreceived':
        this.toppedUp(evt);
        break;
      case 'received':
      case 'sent':
        this.updatedBalance(evt);
        break;
      case 'callschanged':
        //Test this. Issue 2
        this.telephony.calls.forEach((function(call) {
          if (call.state === 'disconnected') {
            this.updateBalance();
          }
          console.log('Estado de la llamada: ' + call.state);
        }).bind(this));
        break;
    }
  },

  getInitialBalance: function() {
    console.log('Getting initial balance');
    this.balanceText = document.getElementById('cost-control-spent');
    this.dateText = document.getElementById('cost-control-date');
    this.updateBalance();
  },

  updateBalance: function() {
    console.log('Sending SMS to get balance');
    this.updateUI(true);
    this.sms.send(this.CHECK_BALANCE_NUMBER, this.CHECK_BALANCE_TEXT);
    //We listen for the SMS a prudential time, then, we just skip any SMS
    this.timeout = window.setTimeout((function() {
      console.log('Removing listener for incoming balance check SMS');
      this.sms.removeEventListener('received', this);
      this.updateUI(false, 0);
    }).bind(this), 1000 * 60 * 5); //5 minutes to wait for a message
    this.sms.addEventListener('received', this);
  },

  updatedBalance: function(evt) {
    var receivedBalance = this._parseSMS(evt.message);
    if (receivedBalance !== null) {
      this.saveBalance(receivedBalance);
      this.updateUI(false, receivedBalance);
      this.sms.removeEventListener('received', this);
      window.clearTimeout(this.timeout);
    }
  },

  _parseSMS: function(message) {
    //TODO, check for the correct sender. Issue 3
    //if(evt.message.sender !== this.CHECK_BALANCE_NUMBER) return null;
    var regex = new RegExp('[0-9]+.[0-9]+');
    var m = regex.exec(message.body);
    if (m !== null) {
      return m;
    }
    return null;
  },

  updateUI: function(waiting, balance) {
    if (waiting) {
      console.log('Updating UI, we are waiting for cost control SMS');
      this.dateText.innerHTML = this.getSavedDate();
      this.balanceText.innerHTML =
                        parseFloat(this.getSavedBalance()).toFixed(2);
    } else {
      console.log('Updating UI, we have the cost control SMS or timeout ');
      this.dateText.innerHTML = this.getSavedDate();
      var bal = parseFloat(balance) || this.getSavedBalance();
      this.balanceText.innerHTML = parseFloat(bal).toFixed(2);
      console.log('Mostrando feedback con color rosita');
      this.feedback.forEach(function(el) {
        el.setAttribute('class', 'updated');
      });
      window.setTimeout((function() {
        console.log('Eliminando feedback rosita');
        this.feedback.forEach(function(el) {
          el.setAttribute('class', 'not-updated');
        });
      }).bind(this), 10000);
    }
  },

  getSavedBalance: function() {
    var balance = parseFloat(window.localStorage.getItem('balance'));
    if (isNaN(balance) || balance === null) {
      return 0;
    }
    return balance.toFixed(2);
  },

  getSavedDate: function() {
    var date = window.localStorage.getItem('date');
    if (isNaN(date) || date === null) {
       var date2 = new Date();
       return this._getFormatedDate(date2);
    }
    return this._getFormatedDate(date);
  },

  _getFormatedDate: function(date) {
    //XXX: Bug in Gecko. Check with Kaze. Issue 5
    return date.toLocaleFormat('%b %d %H:%M');
  },

  saveBalance: function(balance) {
    console.log('Saving date and balance to the localStorage for later use');
    var date = new Date();
    window.localStorage.setItem('balance', parseFloat(balance).toFixed(2));
    window.localStorage.setItem('date', date.getTime());
  },

  topUp: function() {
    //TODO
    alert('TopUp!!');
  },

  toppedUp: function() {
    //TODO
  },

  _pad: function(num) {
    var s = num + '';
    while (s.length < 2) s = '0' + s;
    return s;
  }
};

CostControl.init();
