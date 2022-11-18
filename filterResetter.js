// ==UserScript==
// @name         Mangadex Filter Resetter
// @namespace    https://github.com/slch/CustomDex
// @version      0.1
// @description  Allows to temporary remove filters for current tab. And go back once done.
// @author       slch
// @match        https://mangadex.org/*
// @match        https://*.mangadex.org/*
// @match        https://*.mangadex.dev/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mangadex.org
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  // added uid to avoid collision with possible other customdexes
  const extStorageKey = "customDex_a037b1ae-e3fc-434a-9085-b0bf4d730665";
  const mdexStorageKey = "md";
  let initialExtState = getStorageObj();

  const profileContainer = await waitForElm(".profile__container");
  const languageSelector = profileContainer.firstChild.lastChild.firstChild;

  const buttonText = initialExtState.isSeeAllEnabled
    ? "Restore filters"
    : "Reset filters";
  const seeAllButton = createSeeAllButton(
    buttonText,
    () => handleButtonClick("isSeeAllEnabled", "seeAllDexState"),
    languageSelector
  );

  languageSelector.after(seeAllButton);

  function handleButtonClick(extFlagKey, extModifiedStateKey) {
    const extState = getStorageObj();
    const checked = !extState[extFlagKey];
    const mdexState = JSON.parse(localStorage[mdexStorageKey]);

    if (checked) {
      extState[extFlagKey] = true;
      extState.savedMdexState = window.structuredClone(
        mdexState.userPreferences
      );

      for (const key of Object.keys(extState[extModifiedStateKey])) {
        mdexState.userPreferences[key] = extState[extModifiedStateKey][key];
      }

      setStorageObj(extState);
      localStorage[mdexStorageKey] = JSON.stringify(mdexState);
      console.log("Reset mangadex preferences to see all content");
      location.reload();
      return;
    } else {
      if (!extState.savedMdexState) {
        console.log("Attempted to restore an empty mdex state - aborting");
        return;
      }

      mdexState.userPreferences = window.structuredClone(
        extState.savedMdexState
      );
      extState[extFlagKey] = false;
      extState.savedMdexState = null;
      setStorageObj(extState);
      localStorage[mdexStorageKey] = JSON.stringify(mdexState);
      console.log("Restored mangadex preferences back");
    }

    location.reload();
  }

  function createSeeAllButton(title, handleClick, siblingElm) {
    const el = document.createElement("div");
    copyElmAttr(siblingElm, el);
    el.onclick = handleClick;

    const sp = document.createElement("span");
    const siblingElmSpanChild = siblingElm.querySelector("span");
    copyElmAttr(siblingElmSpanChild, sp);
    sp.innerHTML = title;

    el.appendChild(sp);

    return el;
  }

  function getStorageObj() {
    let s = localStorage[extStorageKey];

    if (s) return JSON.parse(s);

    s = {
      savedMdexState: null,
      seeAllDexState: {
        filteredLanguages: [],
        groupBlacklist: [],
        originLanguages: [],
        showErotic: true,
        showHentai: true,
        showSafe: true,
        userBlacklist: [],
      },
      isSeeAllEnabled: false,
    };
    return s;
  }

  function setStorageObj(obj) {
    localStorage[extStorageKey] = JSON.stringify(obj);
  }

  function copyElmAttr(src, dst) {
    [...src.attributes].forEach((attr) => {
      dst.setAttribute(attr.nodeName, attr.nodeValue);
    });
  }

  function waitForElm(selector) {
    // from https://stackoverflow.com/a/61511955/5717295
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }
})();
