/* -*- Mode: Javascript; indent-tabs-mode:nil; js-indent-level: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */

/*************************************************************
 *
 *  MathJax/extensions/TeX/chemfig3.js
 *
 *  Implements the \cjx command for handling chemical formulas
 *  from the chemfig LaTeX package.
 *
 *  ---------------------------------------------------------------------
 *
 *  Copyright (c) 2011-2015 The MathJax Consortium
 *  Copyright (c) 2015-2017 Martin Hensel
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

//
// Coding Style
//   - use '' for identifiers that can by minified/uglified
//   - use "" for strings that need to stay untouched


MathJax.Extension["TeX/chemfig"] = {
  version: "3.2.0"
};

MathJax.Hub.Register.StartupHook("TeX Jax Ready",function () {

  //-- Global variables
  var TEX = MathJax.InputJax.TeX;
  var bondlen = this.bondlen;  //-- Length of bond as default 20
  var anglelasts = []; //-- Array of Angle by branchnum 
  var branchnum = 0; //-- Number of branch level
  //var bondnum = [1, 1]; //-- Number of offset [offsetTo, offsetFrom]
  var elmstructbefore = [];
  
  //
  //  This is the main class for handing the \cjx and related commands.
  //  Its main method is Parse() which takes the argument to \cjx and
  //  returns the corresponding TeX string.
  //

  var CJX = MathJax.Object.Subclass({
    string: "",   // the \cjx string being parsed

    //
    //  Store the string when a CJX object is created
    //
    Init: function (string) { this.string = string; },

    //
    //  This converts the CJX string to a TeX string.
    //
    Parse: function (stateMachine) {
      var cjxtex = "";
      anglelasts = [0, 0, 0, 0, 0];
      var bondOptions = [0,1,1,1,""]; // [angle, magnify, offsetFrom, offsetTo, option]
      elmstructbefore = [""];
      try {
      //-- Modified by miura on2017.10.29
      	//return texify.go(chemfigParser.go(this.string, stateMachine));
      //-- begin
        //alert("string= "+this.string);
        this.string = this.string.replace(/(~|#)(?![-=])/g, '#'); //-- This means Triple bond
        strtex = texify.go(chemfigParser.go(this.string, stateMachine));
        if (!strtex) {return strtex = "";}
        
  //alert(strtex);
        
        
        strtex_org = strtex;
        strtex = strtex.slice(1, -1);
        strtex = strtex.replace(/\{\}([-=+])\{\}/g, '~{$1}'); //-- {}-{}
    //alert("STRTEX2= "+strtex);
        
        var polymatch = /(\{[-=]\})?(\[:*(\\text\{[-=]\})?\d*\])?\\,\{\\cdot.+\d*\\,\([^~]*/g;
        
        var polystr = strtex.match(polymatch);//.toString();
        if (polystr) {
    //alert("POLYSTR= "+polystr);
          strtex = strtex.replace(polystr, "POLY");
          //polystr = polystr.toString().replace(/\\,/g, '');
          polystr = polystr.toString().replace('{\\cdot}\\,', '').split('\\,');
          polyAngle = ((10*360/polystr[1])|0) / 10;
          
          polyBond = polystr[0].match(/^\{[-=]\}/);
          if (polyBond == null) {
            polyBond = "";
          }
          polyRotate = polystr[0].replace(polyBond, '').replace(/[\[\]]/g, "");
          if (polyRotate.match(/\d+/g) == null) {
          	polyRotate += "0";
          }
    //alert("POLYROTATE= "+polyRotate);
          polyRotateAngle = getAngle(polyRotate) -30;
          polyRotateType = polyRotate.match(/[:*]+/g);
          if (polyRotateType == null) {
            polyRotateType = "";
          }
          if (polyRotateAngle < 0) {
              polyRotateAngle = "\\text{-}" + Math.abs(polyRotateAngle);
          }
          polyRotate = polyRotateType + polyRotateAngle;
    alert("POLYBOND= "+polyBond+" : ROTATE= "+polyRotate+" : POLYANGLE= "+polyRotateAngle);
    
          var polygon = '{-}[]\\mathrm{C}';
          strtex = strtex.replace('POLY', polygon);
    //alert("POLYGON= "+polygon+" : STRTEX= "+strtex);
        
        }
        
        chemtex = strtex.replace(/~(\d)/g, '$1');
        chemtex = strtex.split('~');
        
        //alert("ORG= "+strtex_org+" : STRTEX= "+strtex+" : CHEMTEX= "+chemtex);
        
        
        for (var i=0; i<chemtex.length; i++) {
          var openBranch = "";
          var elmnum = "";
          elmstruct = "";
          bondnum = [1, 1];
          elm = chemtex[i];
          elm = elm.match(/\(|\{([-=+]|#)\d?\}(\[:*[^\]]*\])?|\)$|\d?\\.*/g);
    //alert("ELM= "+elm[0]);
          
          /**
          var polygon = chemtex[i].match(/\\cdot.+\d/g);
          if (polygon) { //-- -[:30]*6(-=-=-=)
            //polygon = chemtex.replace(/\\,{?\\cdot}?\\,|[\{\}]/g, "").replace("\\", "").split(',')
            polygon = chemtex[i].replace(/\\,{?\\cdot}?\\,/g, "").replace("\\", "").split(',')
            alert("ELM= "+chemtex[i]+" : BOND= "+bond+" : ANGLE= "+angle+" : polygon= "+polygon[0]);
           //alert("POLYGON= "+polygon);
          }
          **/
          //{-}[:30],\,{\cdot}\,6\,({-}{=}{-}{=}{-}{=})
          //alert(i+" : ELM= "+chemtex[i]+" : ELM= "+elm);
          //var polygon = chemtex[i].match(/\\cdot.+\d/g);
          //var polygon = chemtex[i].match(/^([-=]?(\[:*\d+\])?\*\d\([-=].+\))/g);
          //if (polygon) { //-- -[:30]*6(-=-=-=)
    	  //  alert('polygon='+polygon);
    	  //}
          
          
          if (elm[0] == "(") {
            openBranch = elm.shift(); //-- openBranch = "(";
          }
          elmnum = chemtex[i].match(/\d\\|(?!X)([A-Z][a-z]?)|[\^|\]]{(\d*[-+]?)/g);
          if (elmnum) { // !== null) {
            //elmnum = elmnum.join('').replace(/[\^\]\{]/g, "").
            elmnum = elmnum.join('').replace(/[\\^\]\{]\\/g, "").
                     replace(/[A-Z]/g, 'L').replace(/[\d-+a-z]/g, 'S');
            elmstruct = elmnum.match(/L(S*)?/g);
          }
          if (elmstruct == null) {
            elmstruct = "";
          }
          
          startWithBond = elm[0].match(/^\{([-=+]|#)\d?\}|\[:*(?:(\\text))?[^\[a-z]*\]/g);
          pos = "("+bondlen+", 0)";
          angle = 0;
          if (startWithBond) {
            bondOptions = elm[0].match(/\{([-=+]|#)\}|\[:*[^\]]*\]/g);
          	bondOptions = bondOptions[1] ? bondOptions[1] : '[0,1,1,1,""]';
          	bondOptions = bondOptions.replace(/[\{\}\[\]]|\\mkern\dmu\s?|\\mathrm\s?/g, "");
          	bondOptions = bondOptions.replace(/\\,{?\\cdot}?\\,/g, ".");
          	bondOptions = bondOptions.split(',');
            bond = startWithBond[0].match(/[-=+]|#|\d/g); //-- {-2}
    //alert("BOND= "+bond);
            if (typeof bond[1] !== "undefined"){
              elm[1] = bond[1] + elm[1];
              bond = bond[0];
            }
            angle = bondOptions[0] ? bondOptions[0] : "[0]";
            elm = (typeof elm[1] === "undefined") ? " " : elm[1];
            angleprev = anglelasts[branchnum];
            angle = getAngle(angle);
            angle = anglelasts[branchnum];
            if (openBranch) {
              anglelasts[branchnum+1] = angle;
              anglelasts[branchnum] = angleprev;
            }
            pos = "(" + COS(angle) + ", " + SIN(angle) + ")";
            if (bond == "+") {
              bond = '}"X'+branchnum+'";"X'+branchnum+
                     '"+('+bondlen/2+',0)*{+}="X'+branchnum+'",\\ar@{';
              pos = "("+bondlen/2+",0)";
            }
          } else { //-- startWithoutBond
          	if (i==0) {
          	  pos = "(0, 0)";
          	}
            bond = "";
            elm = elm[0];
          } //-- End of startWithBond
          
          elm = elm.trim();
          if (elm !== "") {
            elmnt = '*{'+elm+'}';
          } else {
            elmnt = '';
          }
          if (i==0) {
          	branchnum = 0;
            cjxtex = '\\ar@{}(0,0)*{\\phantom{X}}="X' + branchnum + '"="Y' + branchnum + '"="Z' + branchnum + '",';
          }
  //alert("ELM= "+elm+" : ANGLE["+branchnum+"]= "+anglelasts);
          cjxtex += drawStructure(elm, elmstruct, openBranch, bondOptions);
        } //-- End of for loop
        
        cjxtex = '\\begin{xy}{' + cjxtex + '}\\end{xy}';
        strtex = cjxtex;
        return strtex;
      //-- end
      } catch (ex) {
        TEX.Error(ex);
      }
    }
  });

  /**************************************************
   *
   *  Add private functions
   *
   **************************************************/
  //getElmOffset = function (elmstruct, bondnum, frommode=0) {
  getElmOffset = function (elmstruct, bondnum, frommode) {
    //-- Element Width is set to L:4mm, S:2mm
    var elmstruct = elmstruct;
    var elmoffset = 0;
    
    if (elmstruct == "") {
      return elmoffset = 0;
    }
    var elmfull = elmstruct.join('');
    numL = elmfull.match(/L/g).length;
    numS = elmfull.length - numL;
    centerlen = 2 * numL + numS; //-- (4 * numL + 2 * numS) / 2;
    var elmLeft = "";
    for (var j=0; j<bondnum-1; j++) {
      elmLeft += elmstruct[j];
    }
    if (leftlenL = elmLeft.match(/L/g)) {
      leftlenL = leftlenL.length;
    } else {
      leftlenL = 0;
    }
    if (leftlenS = elmLeft.match(/S/g)) {
      leftlenS = leftlenS.length;
    } else {
      leftlenS = 0;
    }
    var leftlen = 4 * leftlenL + 2 * leftlenS;
    if (frommode) {
      elmoffset = -leftlen;
    } else {
      elmoffset = centerlen - leftlen - 2;
    }
    return elmoffset;
  }
  
  //-- Drawing Structures
  drawStructure = function (elm, elmstruct, openBranch, bondOptions) {
    var closenum = 0;
    //angle = bondOptions[0] ? bondOptions[0] : "[0]";
    magnify = bondOptions[1] ? bondOptions[1] : 1;
    offsetFrom = bondOptions[2] ? bondOptions[2] : 1;
    offsetTo = bondOptions[3] ? bondOptions[3] : 1;
    pos = pos.replace("(", "").replace(")","").split(',');
    pos = '(' + magnify * pos[0] + ',' + magnify * pos[1] + ')';
    elmoffsetTo = getElmOffset(elmstruct, offsetTo);
    
    bond = "{"+bond+"}";
    if (bond == "{#}") {
      bond = "3{-}";
    }
    //-- Added on 20190119
    if (bond == "{<}") {
      bond = "3{-}";
    }
    
    if (openBranch) { //-- "("
      
      if (elm !== "") {
        elmnt = '*{'+elm+'}';
        phantom = '*{\\phantom{Y}}';
      } else {
      	elmnt = '';
      	phantom = '';
      }
      if (elm.substr(-1) == ")") {
        closeBranch = elm.substr(-1);
        closenum = elm.match(/\)+$/)[0].length;
        elm = elm.slice(0, -closenum);
        if (elm !== "") {
          elmnt = '*{'+elm+'}';
          phantom = '*{\\phantom{Y}}';
        } else {
          elmnt = '';
          phantom = '';
        }
      }
      if (angle == 0) {
        cjxtex = '\\ar@'+bond+'"X' + branchnum + '";"X' + branchnum + '"+' + 
                  pos + '="X' + (branchnum+1) + '"*{\\phantom{Z}},';
        cjxtex += '\\ar@{}"X' + branchnum + '"+' + pos + '="Y' + (++branchnum) + 
                  '"+('+elmoffsetTo+',0)' + elmnt + '="X' + branchnum + '",';
        elmstructbefore[branchnum] = elmstruct;
      } else {
        branchnum++;
        elmoffsetFrom = getElmOffset(elmstructbefore[branchnum-1], offsetFrom, 0);
        cjxtex = '\\ar@'+bond+'"X' + (branchnum-1) + '"*{}' + '-('+elmoffsetFrom+',0)' + 
                  '="Y' + (branchnum-1) + '"'+ phantom + ';"Y' + (branchnum-1) + '"+' + 
                  pos + '="X' + (branchnum+0) + '"' + phantom + ',';
        cjxtex += '\\ar@{}"Y' + (branchnum-1) + '"+' + pos + '="Y' + (branchnum-1) + 
                  '"*{\\phantom{Y}}+('+elmoffsetTo+',0)' + elmnt + '="X' + branchnum + '",';
        cjxtex += '\\ar@{}"Y' + (branchnum-1) + '"="Y' + branchnum + '"*{},';
        elmstructbefore[branchnum] = elmstruct;
      }
      branchnum -= closenum;
    } else { //-- Not openBranch
      closenum = 0;
      if (elm.substr(-1) == ")") {
        closenum = elm.match(/\)+$/)[0].length;
       	elm = elm.slice(0, -closenum);
        if (elm !== "") {
           elmnt = '*{'+elm+'}';
        } else {
          elmnt = '';
        }
      }
      
      if (elm == "") {
        phantom = '';
      } else {
        phantom = '*{\\phantom{X}}';
      }
      
      var bnum = branchnum;// ? branchnum -1 : branchnum;      
      if (angle == 0) {
        cjxtex = '\\ar@'+bond+'"X' + branchnum + '";"X' + branchnum + '"+' + 
                  pos + '="Y' + branchnum + '"*{}+(' + elmoffsetTo + ',0)' + elmnt + '="X' + branchnum + '"="Z' + branchnum + '",';
        elmstructbefore[branchnum] = elmstruct;
      } else {
        elmoffsetFrom = getElmOffset(elmstructbefore[bnum], offsetFrom);
        cjxtex = '\\ar@'+bond+'"X' + branchnum + '"*{}' + '-(' + elmoffsetFrom + ',0)="Y' + 
        	      branchnum + '"' + phantom + ';"Y' + branchnum + '"+' + 
                  pos + phantom + '="X' + branchnum + '",';
        
        cjxtex += '\\ar@{}"X' + branchnum + '"="Y' + branchnum + '"+(' + elmoffsetTo + ',0)' + 
                  elmnt + '="X' + branchnum +'",';
        elmstructbefore[branchnum] = elmstruct;
      }
      branchnum -= closenum;
    }
    return cjxtex;
  }
  
  //-- Calcuration angle
  getAngle = function (angle) {
  	angle = angle.toString();
  	/****
    var angle_45 = angle.match(/\[[^:].+/g); // number of angle by 45 deg 0-7
    var angle_abs = angle.match(/\[:[^:].+/g); // absolute angle by colon deg 0-7 [:
    var angle_rel = angle.match(/\[::.+/g); // relative angle by double colon deg 0-7 [::
    ****/
    var angle_45 = angle.match(/^[^:].*/g); // number of angle by 45 deg 0-7
    var angle_abs = angle.match(/^:[^:].*/g); // absolute angle by colon deg 0-7 [:
    var angle_rel = angle.match(/^::.+/g); // relative angle by double colon deg 0-7 [::
    if (angle_45) {
      var angle = angle_45.toString().match(/[-+]|\d+/g).join('');
      if (angle < 8) {
        angle = 45 * angle;
        anglelasts[branchnum] = parseInt(angle);
      } else {
        alert("ANGLE45 should be between 0 and 7!");
        return 0;
      }
    } else if (angle_abs) {
      var angle = angle_abs.toString().match(/[-+]|\d+/g).join('');
      if (angle >= -180 && angle <= 180) {
        angle = angle;
        anglelasts[branchnum] = parseInt(angle);
      } else {
        alert("Absolute_ANGLE should be between -180 and 180!");
        return 0;
      }
    } else if (angle_rel) {//alert("ANGLE= "+angle);
      var angle = angle_rel.toString().match(/[-+]|\d+/g).join('');
      if (angle >= -90 && angle <= 90) {
      //if (angle >= -360 && angle <= 360) {
        anglelasts[branchnum] += parseInt(angle);
      } else {
        alert("Relative_ANGLE should be between -90 and 90!");
        return 0;
      }
    } else {
      return 0;
    }
    return angle;
  };
  
  COS = function (angle) {
  	cos = (bondlen*10*Math.cos(angle*(Math.PI/180))|0)/10;
  	return cos;
  };
    
  SIN = function (angle) {
  	sin = (bondlen*10*Math.sin(angle*(Math.PI/180))|0)/10;
  	return sin;
  };

  //
  // Core parser for chemfig syntax  (recursive)
  //
  var chemfigParser = {};
  //
  // Parses mchem \cjx syntax
  //
  // Call like
  //   go("H2O");
  //
  // Looks through chemfigParser.transitions, to execute a matching action
  // (recursive)
  //
  chemfigParser.go = function(input, stateMachine) {
    if (!input) { return input; }
    if (stateMachine === undefined) { stateMachine = 'cjx'; }
    var state = '0';

    //
    // String buffers for parsing:
    //
    // buffer.a == amount
    // buffer.o == element
    // buffer.b == left-side superscript
    // buffer.p == left-side subscript
    // buffer.q == right-side subscript
    // buffer.d == right-side superscript
    //
    // buffer.r == arrow
    // buffer.rdt == arrow, script above, type
    // buffer.rd == arrow, script above, content
    // buffer.rqt == arrow, script below, type
    // buffer.rq == arrow, script below, content
    //
    // buffer.text
    // buffer.rm
    // etc.
    //
    // buffer.parenthesisLevel == int, starting at 0
    // buffer.sb == bool, space before
    // buffer.beginsWithBond == bool
    //
    // These letters are also used as state names.
    //
    // Other states:
    // 0 == begin of main part (arrow/operator unlikely)
    // 1 == next entity
    // 2 == next entity (arrow/operator unlikely)
    // 3 == next atom
    // c == macro
    //
    var buffer = {};
    buffer['parenthesisLevel'] = 0;

    input = input.replace(/[\u2212\u2013\u2014\u2010]/g, "-");
    input = input.replace(/[\u2026]/g, "...");

    var lastInput, watchdog;
    var output = [];
    while (true) {
      if (lastInput !== input) {
        watchdog = 10;
        lastInput = input;
      } else {
        watchdog--;
      }
      //
      // Look for matching string in transition table
      //
      var machine = chemfigParser.stateMachines[stateMachine];
      var iTmax = machine.transitions.length;
      iterateTransitions:
      for (var iT=0; iT<iTmax; iT++) {  // Surprisingly, looping is not slower than another data structure with direct lookups.  635d910e-0a6d-45b4-8d38-2f98ac9d9a94
        var t = machine.transitions[iT];
        var tasks = t.actions[state]  ||  t.actions['*']  ||  null;
        if (tasks) {  // testing tasks (actions) before matches is slightly faster
          var matches = chemfigParser.matchh(t.matchh, input);
          if (matches) {
            //
            // Execute action
            //
            var actions = chemfigParser.concatNotUndefined([], tasks.action);
            var iAmax = actions.length;
            for (var iA=0; iA<iAmax; iA++) {
              var a = actions[iA];
              var o;
              var option = undefined;
              if (a.type) {
                option = a.option;
                a = a.type;
              }
              if (typeof a === "string") {
                if (machine.actions[a]) {
                  o = machine.actions[a](buffer, matches.matchh, option);
                } else if (chemfigParser.actions[a]) {
                  o = chemfigParser.actions[a](buffer, matches.matchh, option);
                } else {
                  throw ["MhchemBugA", "chemfig bug A. Please report. (" + a + ")"];  // Trying to use non-existing action
                }
              } else if (typeof a === "function") {
                o = a(buffer, matches.matchh);
              }
              output = chemfigParser.concatNotUndefined(output, o);
            }
            //
            // Set next state,
            // Shorten input,
            // Continue with next character
            //   (= apply only one transition per position)
            //
            state = tasks.nextState || state;
            if (input.length > 0) {
              if (!tasks.revisit) {
                input = matches.remainder;
              }
              if (!tasks.toContinue) {
                break iterateTransitions;
              }
            } else {
              return output;
            }
          }
        }
      }
      //
      // Prevent infinite loop
      //
      if (watchdog <= 0) {
        throw ["MhchemBugU", "chemfig bug U. Please report."];  // Unexpected character
      }
    }
  };
  chemfigParser.concatNotUndefined = function(a, b) {
    if (!b) { return a; }
    if (!a) { return [].concat(b); }
    return a.concat(b);
  };

  //
  // Matching patterns
  // either regexps or function that return null or {match:"a", remainder:"bc"}
  //
  chemfigParser.patterns = {
    // property names must not look like integers ("2") for correct property traversal order, later on
    'empty': /^$/,
    'else': /^./,
    'else2': /^./,
    'space': /^\s/,
    'space A': /^\s(?=[A-Z\\$])/,
    'a-z': /^[a-z]/,
    'x': /^x/,
    'x$': /^x$/,
    'i$': /^i$/,
    'letters': /^(?:[a-zA-Z\u03B1-\u03C9\u0391-\u03A9?@]|(?:\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))))+/,
    '\\greek': /^\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))/,
    'one lowercase latin letter $': /^(?:([a-z])(?:$|[^a-zA-Z]))$/,
    '$one lowercase latin letter$ $': /^\$(?:([a-z])(?:$|[^a-zA-Z]))\$$/,
    'one lowercase greek letter $': /^(?:\$?[\u03B1-\u03C9]\$?|\$?\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\s*\$?)(?:\s+|\{\}|(?![a-zA-Z]))$/,
    'digits': /^[0-9]+/,
    '-9.,9': /^[+\-]?(?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))/,
    '-9.,9 no missing 0': /^[+\-]?[0-9]+(?:[.,][0-9]+)?/,
    '(-)(9.,9)(e)(99)': function (input) {
      var m = input.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+)?)(\((?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+)?)\))?(?:([eE]|\s*(\*|x|\\times|\u00D7)\s*10\^)([+\-]?[0-9]+|\{[+\-]?[0-9]+\}))?/);
      if (m && m[0]) {
        return { matchh: m.splice(1), remainder: input.substr(m[0].length) };
      }
      return null;
    },
    '(-)(9)^(-9)':  function (input) {
      var m = input.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+)?)\^([+\-]?[0-9]+|\{[+\-]?[0-9]+\})/);
      if (m && m[0]) {
        return { matchh: m.splice(1), remainder: input.substr(m[0].length) };
      }
      return null;
    },
    'state of aggregation $': function (input) {  // or crystal system
      var a = this['_findObserveGroups'](input, "", /^\([a-z]{1,3}(?=[\),])/, ")", "");  // (aq), (aq,$\infty$), (aq, sat)
      if (a  &&  a.remainder.match(/^($|[\s,;\)\]\}])/)) { return a; }  //  AND end of 'phrase'
      var m = input.match(/^(?:\((?:\\ca\s?)?\$[amothc]\$\))/);  // OR crystal system ($o$) (\ca$c$)
      if (m) {
        return { matchh: m[0], remainder: input.substr(m[0].length) };
      }
      return null;
    },
    '_{(state of aggregation)}$': /^_\{(\([a-z]{1,3}\))\}/,
    '\{[(': /^(?:\\\{|\[|\()/,
    ')]\}': /^(?:\)|\]|\\\})/,
    ', ': /^[,;]\s*/,
    ',': /^[,;]/,
    '.': /^[.]/,
    '. ': /^([.\u22C5\u00B7\u2022])\s*/,
    '...': /^\.\.\.(?=$|[^.])/,
    '* ': /^([*])\s*/,
    '^{(...)}': function (input) { return this['_findObserveGroups'](input, "^{", "", "", "}"); },
    '^($...$)': function (input) { return this['_findObserveGroups'](input, "^", "$", "$", ""); },
    '^a': /^\^([0-9]+|[^\\_])/,
    '^\\x{}{}':  function (input) { return this['_findObserveGroups'](input, "^", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
    '^\\x{}':  function (input) { return this['_findObserveGroups'](input, "^", /^\\[a-zA-Z]+\{/, "}", ""); },
    '^\\x': /^\^(\\[a-zA-Z]+)\s*/,
    '^(-1)': /^\^(-?\d+)/,
    '\'': /^'/,
    '_{(...)}': function (input) { return this['_findObserveGroups'](input, "_{", "", "", "}"); },
    '_($...$)': function (input) { return this['_findObserveGroups'](input, "_", "$", "$", ""); },
    '_9': /^_([+\-]?[0-9]+|[^\\])/,
    '_\\x{}{}':  function (input) { return this['_findObserveGroups'](input, "_", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
    '_\\x{}':  function (input) { return this['_findObserveGroups'](input, "_", /^\\[a-zA-Z]+\{/, "}", ""); },
    '_\\x': /^_(\\[a-zA-Z]+)\s*/,
    '^_': /^(?:\^(?=_)|\_(?=\^)|[\^_]$)/,
    '{}': /^\{\}/,
    '{...}': function (input) { return this['_findObserveGroups'](input, "", "{", "}", ""); },
    '{(...)}': function (input) { return this['_findObserveGroups'](input, "{", "", "", "}"); },
    '$...$': function (input) { return this['_findObserveGroups'](input, "", "$", "$", ""); },
    '${(...)}$': function (input) { return this['_findObserveGroups'](input, "${", "", "", "}$"); },
    '$(...)$': function (input) { return this['_findObserveGroups'](input, "$", "", "", "$"); },
    '=<>': /^[=<>]/,
    '#': /^[#\u2261]/,
    '+': /^\+/,
    '-$': /^-(?=[\s_},;\]/]|$|\([a-z]+\))/,  // -space -, -; -] -/ -$ -state-of-aggregation
    '-9': /^-(?=[0-9])/,
    '- orbital overlap': /^-(?=(?:[spd]|sp)(?:$|[\s,;\)\]\}]))/,
    '-': /^-/,
    'pm-operator': /^(?:\\pm|\$\\pm\$|\+-|\+\/-)/,
    'operator': /^(?:\+|(?:[\-=<>]|<<|>>|\\approx|\$\\approx\$)(?=\s|$|-?[0-9]))/,
    'arrowUpDown': /^(?:v|\(v\)|\^|\(\^\))(?=$|[\s,;\)\]\}])/,
    '\\bond{(...)}': function (input) { return this['_findObserveGroups'](input, "\\bond{", "", "", "}"); },
    '->': /^(?:<->|<-->|->|<-|<=>>|<<=>|<=>|[\u2192\u27F6\u21CC])/,
    'CMT': /^[CMT](?=\[)/,
    '[(...)]': function (input) { return this['_findObserveGroups'](input, "[", "", "", "]"); },
    '1st-level escape': /^(&|\\\\|\\hline)\s*/,
    '\\,': /^(?:\\[,\ ;:])/,  // \\x - but output no space before
    '\\x{}{}':  function (input) { return this['_findObserveGroups'](input, "", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
    '\\x{}':  function (input) { return this['_findObserveGroups'](input, "", /^\\[a-zA-Z]+\{/, "}", ""); },
    '\\ca': /^\\ca(?:\s+|(?![a-zA-Z]))/,
    '\\x': /^(?:\\[a-zA-Z]+\s*|\\[_&{}%])/,
    'orbital': /^(?:[0-9]{1,2}[spdfgh]|[0-9]{0,2}sp)(?=$|[^a-zA-Z])/,  // only those with numbers in front, because the others will be formatted correctly anyway
    'others': /^[\/~|]/,
    '\\frac{(...)}': function (input) { return this['_findObserveGroups'](input, "\\frac{", "", "", "}", "{", "", "", "}"); },
    '\\overset{(...)}': function (input) { return this['_findObserveGroups'](input, "\\overset{", "", "", "}", "{", "", "", "}"); },
    '\\underset{(...)}': function (input) { return this['_findObserveGroups'](input, "\\underset{", "", "", "}", "{", "", "", "}"); },
    '\\underbrace{(...)}': function (input) { return this['_findObserveGroups'](input, "\\underbrace{", "", "", "}_", "{", "", "", "}"); },
    '\\color{(...)}0': function (input) { return this['_findObserveGroups'](input, "\\color{", "", "", "}"); },
    '\\color{(...)}{(...)}1': function (input) { return this['_findObserveGroups'](input, "\\color{", "", "", "}", "{", "", "", "}"); },
    '\\color(...){(...)}2': function (input) { return this['_findObserveGroups'](input, "\\color", "\\", "", /^(?=\{)/, "{", "", "", "}"); },
    '\\cjx{(...)}': function (input) { return this['_findObserveGroups'](input, "\\cjx{", "", "", "}"); },
    'oxidation$': /^(?:[+-][IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/,
    'd-oxidation$': /^(?:[+-]?\s?[IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/,  // 0 could be oxidation or charge
    'roman numeral': /^[IVX]+/,
    '1/2$': /^[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+(?:\$[a-z]\$|[a-z])?$/,
    'amount': function (input) {
      var matchh;
      // e.g. 2, 0.5, 1/2, -2, n/2, +;  $a$ could be added later in parsing
      matchh = input.match(/^(?:(?:(?:\([+\-]?[0-9]+\/[0-9]+\)|[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+|[+\-]?[0-9]+[.,][0-9]+|[+\-]?\.[0-9]+|[+\-]?[0-9]+)(?:[a-z](?=\s*[A-Z]))?)|[+\-]?[a-z](?=\s*[A-Z])|\+(?!\s))/);
      if (matchh) {
        return { matchh: matchh[0], remainder: input.substr(matchh[0].length) };
      }
      var a = this['_findObserveGroups'](input, "", "$", "$", "");
      if (a) {  // e.g. $2n-1$, $-$
        matchh = a.matchh.match(/^\$(?:\(?[+\-]?(?:[0-9]*[a-z]?[+\-])?[0-9]*[a-z](?:[+\-][0-9]*[a-z]?)?\)?|\+|-)\$$/);
        if (matchh) {
          return { matchh: matchh[0], remainder: input.substr(matchh[0].length) };
        }
      }
      return null;
    },
    'amount2': function (input) { return this['amount'](input); },
    '(KV letters),': /^(?:[A-Z][a-z]{0,2}|i)(?=,)/,
    'formula$': function (input) {
      if (input.match(/^\([a-z]+\)$/)) { return null; }  // state of aggregation = no formula
      var matchh = input.match(/^(?:[a-z]|(?:[0-9\ \+\-\,\.\(\)]+[a-z])+[0-9\ \+\-\,\.\(\)]*|(?:[a-z][0-9\ \+\-\,\.\(\)]+)+[a-z]?)$/);
      if (matchh) {
        return { matchh: matchh[0], remainder: input.substr(matchh[0].length) };
      }
      return null;
    },
    'uprightEntities': /^(?:pH|pOH|pC|pK|iPr|iBu)(?=$|[^a-zA-Z])/,
    '/': /^\s*(\/)\s*/,
    '//': /^\s*(\/\/)\s*/,
    '*': /^\s*\*\s*/,
    '_findObserveGroups': function (input, begExcl, begIncl, endIncl, endExcl, beg2Excl, beg2Incl, end2Incl, end2Excl, combine) {
      var matchh = this['__match'](input, begExcl);
      if (matchh === null) { return null; }
      input = input.substr(matchh.length);
      matchh = this['__match'](input, begIncl);
      if (matchh === null) { return null; }
      var e = this['__findObserveGroups'](input, matchh.length, endIncl || endExcl);
      if (e === null) { return null; }
      var match1 = input.substring(0, (endIncl ? e.endMatchEnd : e.endMatchBegin));
      if (!(beg2Excl || beg2Incl)) {
        return {
          matchh: match1,
          remainder: input.substr(e.endMatchEnd)
        };
      } else {
        var group2 = this['_findObserveGroups'](input.substr(e.endMatchEnd), beg2Excl, beg2Incl, end2Incl, end2Excl);
        if (group2 === null) { return null; }
        var matchRet = [match1, group2.matchh];
        if (combine) { matchRet = matchRet.join(""); }
        return {
          matchh: matchRet,
          remainder: group2.remainder
        };
      }
    },
    '__match': function (input, pattern) {
      if (typeof pattern === "string") {
        if (input.indexOf(pattern) !== 0) { return null; }
        return pattern;
      } else {
        var matchh = input.match(pattern);
        if (!matchh) { return null; }
        return matchh[0];
      }
    },
    '__findObserveGroups': function (input, i, endChars) {
      var braces = 0;
      while (i < input.length) {
        var a = input.charAt(i);
        var matchh = this['__match'](input.substr(i), endChars);
        if (matchh !== null  &&  braces === 0) {
          return { endMatchBegin: i, endMatchEnd: i + matchh.length };
        } else if (a === "{") {
          braces++;
        } else if (a === "}") {
          if (braces === 0) {
            throw ["ExtraCloseMissingOpen", "Extra close brace or missing open brace"];
          } else {
            braces--;
          }
        }
        i++;
      }
      if (braces > 0) {
        return null;
      }
      return null;
    }
  };

  //
  // Matching function
  // e.g. matchh("a", input) will look for the regexp called "a" and see if it matches
  // returns null or {matchh:"a", remainder:"bc"}
  //
  chemfigParser.matchh = function (m, input) {
    var pattern = chemfigParser.patterns[m];
    if (pattern === undefined) {
      throw ["MhchemBugP", "chemfig bug P. Please report. (" + m + ")"];  // Trying to use non-existing pattern
    } else if (typeof pattern === "function") {
      return chemfigParser.patterns[m](input);  // cannot use cached var pattern here, because some pattern functions need this===chemfigParser
    } else {  // RegExp
      var matchh = input.match(pattern);
      if (matchh) {
        var mm;
        if (matchh[2]) {
          mm = [ matchh[1], matchh[2] ];
        } else if (matchh[1]) {
          mm = matchh[1];
        } else {
          mm = matchh[0];
        }
        return { matchh: mm, remainder: input.substr(matchh[0].length) };
      }
      return null;
    }
  };

  //
  // Generic state machine actions
  //
  chemfigParser.actions = {
    'a=': function (buffer, m) { buffer.a = (buffer.a || "") + m; },
    'b=': function (buffer, m) { buffer.b = (buffer.b || "") + m; },
    'p=': function (buffer, m) { buffer.p = (buffer.p || "") + m; },
    'o=': function (buffer, m) { buffer.o = (buffer.o || "") + m; },
    'q=': function (buffer, m) { buffer.q = (buffer.q || "") + m; },
    'd=': function (buffer, m) { buffer.d = (buffer.d || "") + m; },
    'rm=': function (buffer, m) { buffer.rm = (buffer.rm || "") + m; },
    'text=': function (buffer, m) { buffer.text = (buffer.text || "") + m; },
    'insert': function (buffer, m, a) { return { type: a }; },
    'insert+p1': function (buffer, m, a) { return { type: a, p1: m }; },
    'insert+p1+p2': function (buffer, m, a) { return { type: a, p1: m[0], p2: m[1] }; },
    'copy': function (buffer, m) { return m; },
    'rm': function (buffer, m) { return { type: 'rm', p1: m }; },
    'text': function (buffer, m) { return chemfigParser.go(m, 'text'); },
    '{text}': function (buffer, m) {
      var ret = [ "{" ];
      ret = chemfigParser.concatNotUndefined(ret, chemfigParser.go(m, 'text'));
      ret = chemfigParser.concatNotUndefined(ret, "}");
      return ret;
    },
    'tex-math': function (buffer, m) { return chemfigParser.go(m, 'tex-math'); },
    'tex-math tight': function (buffer, m) { return chemfigParser.go(m, 'tex-math tight'); },
    'bond': function (buffer, m, k) { return { type: 'bond', kind: k || m }; },
    'color0-output': function (buffer, m) { return { type: 'color0', color: m[0] }; },
    'cjx': function (buffer, m) { return chemfigParser.go(m); },
    '1/2': function (buffer, m) {
      var ret;
      if (m.match(/^[+\-]/)) {
        ret = [ m.substr(0, 1) ];
        m = m.substr(1);
      }
      var n = m.match(/^([0-9]+|\$[a-z]\$|[a-z])\/([0-9]+)(\$[a-z]\$|[a-z])?$/);
      n[1] = n[1].replace(/\$/g, "");
      ret = chemfigParser.concatNotUndefined(ret, { type: 'frac', p1: n[1], p2: n[2] } );
      if (n[3]) {
        n[3] = n[3].replace(/\$/g, "");
        ret = chemfigParser.concatNotUndefined(ret, { type: 'tex-math', p1: n[3] } );
      }
      return ret;
    },
    '9,9': function (buffer, m) { return chemfigParser.go(m, '9,9'); }
  };

  //
  // State machine definitions
  //
  chemfigParser.stateMachines = {};
  //
  // convert  { 'a': { '*': { action: 'output' } } }  to  [ { matchh: 'a', actions: { '*': { action: 'output' } } } ]
  // with expansion of 'a|b' to 'a' and 'b' (at 2 places)
  //
  chemfigParser.createTransitions = function (o) {
    var a, b, s, i;
    //
    // 1. o ==> oo, expanding 'a|b'
    //
    var oo = {};
    for (a in o) {
      if (a.indexOf("|") !== -1) {
        s = a.split("|");
        for (i=0; i<s.length; i++) {
          oo[s[i]] = o[a];
        }
      } else {
        oo[a] = o[a];
      }
    }
    //
    // 2. oo ==> transition array
    //
    var transitions = [];
    for (a in oo) {
      var actions = {};
      var ooa = oo[a];
      for (b in ooa) {
        //
        // expanding action-state:'a|b' if needed
        //
        if (b.indexOf("|") !== -1) {
          s = b.split("|");
          for (i=0; i<s.length; i++) {
            actions[s[i]] = ooa[b];
          }
        } else {
          actions[b] = ooa[b];
        }
      }
      transitions.push( { matchh: a, actions: actions } );
    }
    return transitions;
  };
  //
  //
  // \cjx state machines
  //
  //
  // Transitions and actions of main parser
  //
  chemfigParser.stateMachines['cjx'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': { action: 'output' } },
      'else':  {
        '0|1|2': { action: 'beginsWithBond=false', revisit: true, toContinue: true } },
      'oxidation$': {
        '0': { action: 'oxidation-output' } },
      'CMT': {
        'r': { action: 'rdt=', nextState: 'rt' },
        'rd': { action: 'rqt=', nextState: 'rdt' } },
      'arrowUpDown': {
        '0|1|2|as': { action: [ 'sb=false', 'output', 'operator' ], nextState: '1' } },
      'uprightEntities': {
        '0|1|2': { action: [ 'o=', 'output' ], nextState: '1' } },
      'orbital': {
        '0|1|2|3': { action: 'o=', nextState: 'o' } },
      '->': {
        '0|1|2|3': { action: 'r=', nextState: 'r' },
        'a|as': { action: [ 'output', 'r=' ], nextState: 'r' },
        '*': { action: [ 'output', 'r=' ], nextState: 'r' } },
      '+': {
        'o': { action: 'd= kv',  nextState: 'd' },
        'd|D': { action: 'd=', nextState: 'd' },
        'q': { action: 'd=',  nextState: 'qd' },
        'qd|qD': { action: 'd=', nextState: 'qd' },
        'dq': { action: [ 'output', 'd=' ], nextState: 'd' },
        '3': { action: [ 'sb=false', 'output', 'operator' ], nextState: '0' } },
      'amount': {
        '0|2': { action: 'a=', nextState: 'a' } },
      'pm-operator': {
        '0|1|2|a|as': { action: [ 'sb=false', 'output', { type: 'operator', option: '\\pm' } ], nextState: '0' } },
      'operator': {
        '0|1|2|a|as': { action: [ 'sb=false', 'output', 'operator' ], nextState: '0' } },
      '-$': {
        'o|q': { action: [ 'charge or bond', 'output' ],  nextState: 'qd' },
        'd': { action: 'd=', nextState: 'd' },
        'D': { action: [ 'output', { type: 'bond', option: "-" } ], nextState: '3' },
        'q': { action: 'd=',  nextState: 'qd' },
        'qd': { action: 'd=', nextState: 'qd' },
        'qD|dq': { action: [ 'output', { type: 'bond', option: "-" } ], nextState: '3' } },
      '-9': {
        '3|o': { action: [ 'output', { type: 'insert', option: 'hyphen' } ], nextState: '3' } },
      '- orbital overlap': {
        'o': { action: { type: '- after o', option: true }, nextState: '2' },
        'd': { action: { type: '- after d', option: true }, nextState: '2' } },
      '-': {
        '0|1|2': { action: [ { type: 'output', option: 1 }, 'beginsWithBond=true', { type: 'bond', option: "-" } ], nextState: '3' },
        '3': { action: { type: 'bond', option: "-" } },
        'a': { action: [ 'output', { type: 'insert', option: 'hyphen' } ], nextState: '2' },
        'as': { action: [ { type: 'output', option: 2 }, { type: 'bond', option: "-" } ], nextState: '3' },
        'b': { action: 'b=' },
        'o': { action: '- after o', nextState: '2' },
        'q': { action: '- after o', nextState: '2' },
        'd|qd|dq': { action: '- after d', nextState: '2' },
        'D|qD|p': { action: [ 'output', { type: 'bond', option: "-" } ], nextState: '3' } },
      'amount2': {
        '1|3': { action: 'a=', nextState: 'a' } },
      'letters': {
        '0|1|2|3|a|as|b|p|bp|o': { action: 'o=', nextState: 'o' },
        'q|dq': { action: ['output', 'o='], nextState: 'o' },
        'd|D|qd|qD': { action: 'o after d', nextState: 'o' } },
      'digits': {
        'o': { action: 'q=', nextState: 'q' },
        'd|D': { action: 'q=', nextState: 'dq' },
        'q': { action: [ 'output', 'o=' ], nextState: 'o' },
        'a': { action: 'o=', nextState: 'o' } },
      'space A': {
        'b|p|bp': {} },
      'space': {
        'a': { nextState: 'as' },
        '0': { action: 'sb=false' },
        '1|2': { action: 'sb=true' },
        'r|rt|rd|rdt|rdq': { action: 'output', nextState: '0' },
        '*': { action: [ 'output', 'sb=true' ], nextState: '1'} },
      '1st-level escape': {
        '1|2': { action: [ 'output', { type: 'insert+p1', option: '1st-level escape' } ] },
        '*': { action: [ 'output', { type: 'insert+p1', option: '1st-level escape' } ], nextState: '0' } },
      '[(...)]': {
        'r|rt': { action: 'rd=', nextState: 'rd' },
        'rd|rdt': { action: 'rq=', nextState: 'rdq' } },
      '...': {
        'o|d|D|dq|qd|qD': { action: [ 'output', { type: 'bond', option: "..." } ], nextState: '3' },
        '*': { action: [ { type: 'output', option: 1 }, { type: 'insert', option: 'ellipsis' } ], nextState: '1' } },
      '. |* ': {
        '*': { action: [ 'output', { type: 'insert', option: 'addition compound' } ], nextState: '1' } },
      'state of aggregation $': {
        '*': { action: [ 'output', 'state of aggregation' ], nextState: '1' } },
      '\{[(': {
        'a|as|o': { action: [ 'o=', 'output', 'parenthesisLevel++' ], nextState: '2' },
        '0|1|2|3': { action: [ 'o=', 'output', 'parenthesisLevel++' ], nextState: '2' },
        '*': { action: [ 'output', 'o=', 'output', 'parenthesisLevel++' ], nextState: '2' } },
      ')]\}': {
        '0|1|2|3|b|p|bp|o': { action: [ 'o=', 'parenthesisLevel--' ], nextState: 'o' },
        'a|as|d|D|q|qd|qD|dq': { action: [ 'output', 'o=', 'parenthesisLevel--' ], nextState: 'o' } },
      ', ': {
        '*': { action: [ 'output', 'comma' ], nextState: '0' } },
      '^_': {  // ^ and _ without a sensible argument
        '*': { } },
      '^{(...)}|^($...$)': {
        '0|1|2|as': { action: 'b=', nextState: 'b' },
        'p': { action: 'b=', nextState: 'bp' },
        '3|o': { action: 'd= kv', nextState: 'D' },
        'q': { action: 'd=', nextState: 'qD' },
        'd|D|qd|qD|dq': { action: [ 'output', 'd=' ], nextState: 'D' } },
      '^a|^\\x{}{}|^\\x{}|^\\x|\'': {
        '0|1|2|as': { action: 'b=', nextState: 'b' },
        'p': { action: 'b=', nextState: 'bp' },
        '3|o': { action: 'd= kv', nextState: 'd' },
        'q': { action: 'd=', nextState: 'qd' },
        'd|qd|D|qD': { action: 'd=' },
        'dq': { action: [ 'output', 'd=' ], nextState: 'd' } },
      '_{(state of aggregation)}$': {
        'd|D|q|qd|qD|dq': { action: [ 'output', 'q=' ], nextState: 'q' } },
      '_{(...)}|_($...$)|_9|_\\x{}{}|_\\x{}|_\\x': {
        '0|1|2|as': { action: 'p=', nextState: 'p' },
        'b': { action: 'p=', nextState: 'bp' },
        '3|o': { action: 'q=', nextState: 'q' },
        'd|D': { action: 'q=', nextState: 'dq' },
        'q|qd|qD|dq': { action: [ 'output', 'q=' ], nextState: 'q' } },
      '=<>': {
        '0|1|2|3|a|as|o|q|d|D|qd|qD|dq': { action: [ { type: 'output', option: 2 }, 'bond' ], nextState: '3' } },
      '#': {
        '0|1|2|3|a|as|o': { action: [ { type: 'output', option: 2 }, { type: 'bond', option: "#" } ], nextState: '3' } },
      '{}': {
        '*': { action: { type: 'output', option: 1 },  nextState: '1' } },
      '{...}': {
        '0|1|2|3|a|as|b|p|bp': { action: 'o=', nextState: 'o' },
        'o|d|D|q|qd|qD|dq': { action: [ 'output', 'o=' ], nextState: 'o' } },
      '$...$': {
        'a': { action: 'a=' },  // 2$n$
        '0|1|2|3|as|b|p|bp|o': { action: 'o=', nextState: 'o' },  // not 'amount'
        'as|o': { action: 'o=' },
        'q|d|D|qd|qD|dq': { action: [ 'output', 'o=' ], nextState: 'o' } },
      '\\bond{(...)}': {
        '*': { action: [ { type: 'output', option: 2 }, 'bond' ], nextState: "3" } },
      '\\frac{(...)}': {
        '*': { action: [ { type: 'output', option: 1 }, 'frac-output' ], nextState: '3' } },
      '\\overset{(...)}': {
        '*': { action: [ { type: 'output', option: 2 }, 'overset-output' ], nextState: '3' } },
      '\\underset{(...)}': {
        '*': { action: [ { type: 'output', option: 2 }, 'underset-output' ], nextState: '3' } },
      '\\underbrace{(...)}': {
        '*': { action: [ { type: 'output', option: 2 }, 'underbrace-output' ], nextState: '3' } },
      '\\color{(...)}{(...)}1|\\color(...){(...)}2': {
        '*': { action: [ { type: 'output', option: 2 }, 'color-output' ], nextState: '3' } },
      '\\color{(...)}0': {
        '*': { action: [ { type: 'output', option: 2 }, 'color0-output' ] } },
      '\\cjx{(...)}': {
        '*': { action: [ { type: 'output', option: 2 }, 'cjx' ], nextState: '3' } },
      '\\,': {
        '*': { action: [ { type: 'output', option: 1 }, 'copy' ], nextState: '1' } },
      '\\x{}{}|\\x{}|\\x': {
        '0|1|2|3|a|as|b|p|bp|o|c0': { action: [ 'o=', 'output' ], nextState: '3' },
        '*': { action: ['output', 'o=', 'output' ], nextState: '3' } },
      'others': {
        '*': { action: [ { type: 'output', option: 1 }, 'copy' ], nextState: '3' } },
      'else2': {
        'a': { action: 'a to o', nextState: 'o', revisit: true },
        'as': { action: [ { type: 'output' }, 'sb=true' ], nextState: '1', revisit: true },
        'r|rt|rd|rdt|rdq': { action: [ 'output' ], nextState: '0', revisit: true },
        '*': { action: [ 'output', 'copy' ], nextState: '3' } }
    }),
    actions: {
      'o after d': function (buffer, m) {
        var ret;
        if (buffer.d.match(/^[0-9]+$/)) {
          var tmp = buffer.d;
          buffer.d = undefined;
          ret = this['output'](buffer);
          buffer.b = tmp;
        } else {
          ret = this['output'](buffer);
        }
        chemfigParser.actions['o='](buffer, m);
        return ret;
      },
      'd= kv': function (buffer, m) {
        buffer.d = m;
        buffer['d-type'] = 'kv';
      },
      'charge or bond': function (buffer, m) {
        if (buffer['beginsWithBond']) {
          var ret = chemfigParser.concatNotUndefined(ret, this['output'](buffer));
          ret = chemfigParser.concatNotUndefined(ret, chemfigParser.actions['bond'](buffer, m, "-"));
          return ret;
        } else {
          buffer.d = m;
        }
      },
      '- after o': function (buffer, m, isOrbitalOverlap) {
        var hyphenFollows = isOrbitalOverlap  ||  this['_hyphenFollows'](buffer, m);
        var ret = chemfigParser.concatNotUndefined(null, this['output'](buffer, m));
        if (hyphenFollows) {
          ret = chemfigParser.concatNotUndefined(ret, { type: 'hyphen' });
        } else {
          ret = chemfigParser.concatNotUndefined(ret, chemfigParser.actions['bond'](buffer, m, "-"));
        }
        return ret;
      },
      '- after d': function (buffer, m, isOrbitalOverlap) {
        var hyphenFollows = isOrbitalOverlap  ||  this['_hyphenFollows'](buffer, m);
        var ret;
        if (hyphenFollows) {
          ret = chemfigParser.concatNotUndefined(ret, this['output'](buffer, m));
          ret = chemfigParser.concatNotUndefined(ret, { type: 'hyphen' });
        } else {
          var c1 = chemfigParser.matchh('digits', buffer.d || "");
          if (c1 && c1.remainder==='') {
            ret = chemfigParser.concatNotUndefined(null, chemfigParser.actions['d='](buffer, m));
            ret = chemfigParser.concatNotUndefined(ret, this['output'](buffer));
          } else {
            ret = chemfigParser.concatNotUndefined(ret, this['output'](buffer, m));
            ret = chemfigParser.concatNotUndefined(ret, chemfigParser.actions['bond'](buffer, m, "-"));
          }
        }
        return ret;
      },
      '_hyphenFollows': function (buffer, m) {
        var c1 = chemfigParser.matchh('orbital', buffer.o || "");
        var c2 = chemfigParser.matchh('one lowercase greek letter $', buffer.o || "");
        var c3 = chemfigParser.matchh('one lowercase latin letter $', buffer.o || "");
        var c4 = chemfigParser.matchh('$one lowercase latin letter$ $', buffer.o || "");
        var hyphenFollows =  m==="-" && ( c1 && c1.remainder===''  ||  c2  ||  c3  ||  c4 );
        if (hyphenFollows && !buffer.a && !buffer.b && !buffer.p && !buffer.d && !buffer.q && !c1 && c3) {
          buffer.o = '$' + buffer.o + '$';
        }
        return hyphenFollows;
      },
      'a to o': function (buffer, m) {
          buffer.o = buffer.a;
          buffer.a = undefined;
      },
      'sb=true': function (buffer, m) { buffer.sb = true; },
      'sb=false': function (buffer, m) { buffer.sb = false; },
      'beginsWithBond=true': function (buffer, m) { buffer.beginsWithBond = true; },
      'beginsWithBond=false': function (buffer, m) { buffer.beginsWithBond = false; },
      'parenthesisLevel++': function (buffer, m) { buffer.parenthesisLevel++; },
      'parenthesisLevel--': function (buffer, m) { buffer.parenthesisLevel--; },
      'state of aggregation': function (buffer, m) {
          m = chemfigParser.go(m, 'o');
          return { type: 'state of aggregation', p1: m };
      },
      'comma': function (buffer, m) {
        var a = m.replace(/\s*$/, '');
        var withSpace = (a !== m);
        if (withSpace  &&  buffer['parenthesisLevel'] === 0) {
          return { type: 'comma enumeration L', p1: a };
        } else {
          return { type: 'comma enumeration M', p1: a };
        }
      },
      'output': function (buffer, m, entityFollows) {
        // entityFollows:
        //   undefined = if we have nothing else to output, also ignore the just read space (buffer.sb)
        //   1 = an entity follows, never omit the space if there was one just read before (can only apply to state 1)
        //   2 = 1 + the entity can have an amount, so output a\, instead of converting it to o (can only apply to states a|as)
        var ret;
        if (!buffer.r) {
          ret = [];
          if (!buffer.a && !buffer.b && !buffer.p && !buffer.o && !buffer.q && !buffer.d && !entityFollows) {
            ret = null;
          } else {
            if (buffer.sb) {
              ret.push({ type: 'entitySkip' });
            }
            if (!buffer.o && !buffer.q && !buffer.d && !buffer.b && !buffer.p && entityFollows!==2) {
              buffer.o = buffer.a;
              buffer.a = undefined;
            } else if (!buffer.o && !buffer.q && !buffer.d && (buffer.b || buffer.p)) {
              buffer.o = buffer.a;
              buffer.d = buffer.b;
              buffer.q = buffer.p;
              buffer.a = buffer.b = buffer.p = undefined;
            } else {
              if (buffer.o && buffer['d-type']==='kv' && chemfigParser.matchh('d-oxidation$', buffer.d || "")) {
                buffer['d-type'] = 'oxidation';
              } else if (buffer.o && buffer['d-type']==='kv' && !buffer.q) {
                buffer['d-type'] = undefined;
              }
            }
            buffer.a = chemfigParser.go(buffer.a, 'a');
            buffer.b = chemfigParser.go(buffer.b, 'bd');
            buffer.p = chemfigParser.go(buffer.p, 'pq');
            buffer.o = chemfigParser.go(buffer.o, 'o');
            if (buffer['d-type'] === 'oxidation') {
              buffer.d = chemfigParser.go(buffer.d, 'oxidation');
            } else {
              buffer.d = chemfigParser.go(buffer.d, 'bd');
            }
            buffer.q = chemfigParser.go(buffer.q, 'pq');
            ret.push({
              type: 'chemfive',
              a: buffer.a,
              b: buffer.b,
              p: buffer.p,
              o: buffer.o,
              q: buffer.q,
              d: buffer.d,
              'd-type': buffer['d-type']
            });
          }
        } else {  // r
          if (buffer.rdt === 'M') {
            buffer.rd = chemfigParser.go(buffer.rd, 'tex-math');
          } else if (buffer.rdt === 'T') {
            buffer.rd = [ { type: 'text', p1: buffer.rd } ];
          } else {
            buffer.rd = chemfigParser.go(buffer.rd);
          }
          if (buffer.rqt === 'M') {
            buffer.rq = chemfigParser.go(buffer.rq, 'tex-math');
          } else if (buffer.rqt === 'T') {
            buffer.rq = [ { type: 'text', p1: buffer.rq } ];
          } else {
            buffer.rq = chemfigParser.go(buffer.rq);
          }
          ret = {
            type: 'arrow',
            r: buffer.r,
            rd: buffer.rd,
            rq: buffer.rq
          };
        }
        for (var p in buffer) {
          if (p !== 'parenthesisLevel'  &&  p !== 'beginsWithBond') {
            delete buffer[p];
          }
        }
        return ret;
      },
      'oxidation-output': function (buffer, m) {
          var ret = [ "{" ];
          ret = chemfigParser.concatNotUndefined(ret, chemfigParser.go(m, 'oxidation'));
          ret = ret.concat([ "}" ]);
        return ret;
      },
      'frac-output': function (buffer, m) {
        return { type: 'frac-ce', p1: chemfigParser.go(m[0]), p2: chemfigParser.go(m[1]) };
      },
      'overset-output': function (buffer, m) {
        return { type: 'overset', p1: chemfigParser.go(m[0]), p2: chemfigParser.go(m[1]) };
      },
      'underset-output': function (buffer, m) {
        return { type: 'underset', p1: chemfigParser.go(m[0]), p2: chemfigParser.go(m[1]) };
      },
      'underbrace-output': function (buffer, m) {
        return { type: 'underbrace', p1: chemfigParser.go(m[0]), p2: chemfigParser.go(m[1]) };
      },
      'color-output': function (buffer, m) {
        return { type: 'color', color1: m[0], color2: chemfigParser.go(m[1]) };
      },
      'r=': function (buffer, m) { buffer.r = (buffer.r || "") + m; },
      'rdt=': function (buffer, m) { buffer.rdt = (buffer.rdt || "") + m; },
      'rd=': function (buffer, m) { buffer.rd = (buffer.rd || "") + m; },
      'rqt=': function (buffer, m) { buffer.rqt = (buffer.rqt || "") + m; },
      'rq=': function (buffer, m) { buffer.rq = (buffer.rq || "") + m; },
      'operator': function (buffer, m, p1) { return { type: 'operator', kind: (p1 || m) }; }
    }
  };
  //
  // Transitions and actions of a parser
  //
  chemfigParser.stateMachines['a'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': {} },
      '1/2$': {
        '0': { action: '1/2' } },
      'else': {
        '0': { nextState: '1', revisit: true } },
      '$(...)$': {
        '*': { action: 'tex-math tight', nextState: '1' } },
      ',': {
        '*': { action: { type: 'insert', option: 'commaDecimal' } } },
      'else2': {
        '*': { action: 'copy' } }
    }),
    actions: {}
  };
  //
  // Transitions and actions of o parser
  //
  chemfigParser.stateMachines['o'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': {} },
      '1/2$': {
        '0': { action: '1/2' } },
      'else': {
        '0': { nextState: '1', revisit: true } },
      'letters': {
        '*': { action: 'rm' } },
      '\\ca': {
        '*': { action: { type: 'insert', option: 'circa' } } },
      '\\x{}{}|\\x{}|\\x': {
        '*': { action: 'copy' } },
      '${(...)}$|$(...)$': {
        '*': { action: 'tex-math' } },
      '{(...)}': {
        '*': { action: '{text}' } },
      'else2': {
        '*': { action: 'copy' } }
    }),
    actions: {}
  };
  //
  // Transitions and actions of text parser
  //
  chemfigParser.stateMachines['text'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': { action: 'output' } },
      '{...}': {
        '*': { action: 'text=' } },
      '${(...)}$|$(...)$': {
        '*': { action: 'tex-math' } },
      '\\greek': {
        '*': { action: [ 'output', 'rm' ] } },
      '\\,|\\x{}{}|\\x{}|\\x': {
        '*': { action: [ 'output', 'copy' ] } },
      'else': {
        '*': { action: 'text=' } }
    }),
    actions: {
      'output': function (buffer, m) {
        if (buffer.text) {
          var ret = { type: 'text', p1: buffer.text };
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        }
        return null;
      }
    }
  };
  //
  // Transitions and actions of pq parser
  //
  chemfigParser.stateMachines['pq'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': {} },
      'state of aggregation $': {
        '*': { action: 'state of aggregation' } },
      'i$': {
        '0': { nextState: '!f', revisit: true } },
      '(KV letters),': {
        '0': { action: 'rm', nextState: '0' } },
      'formula$': {
        '0': { nextState: 'f', revisit: true } },
      '1/2$': {
        '0': { action: '1/2' } },
      'else': {
        '0': { nextState: '!f', revisit: true } },
      '${(...)}$|$(...)$': {
        '*': { action: 'tex-math' } },
      '{(...)}': {
        '*': { action: 'text' } },
      'a-z': {
        'f': { action: 'tex-math' } },
      'letters': {
        '*': { action: 'rm' } },
      '-9.,9': {
        '*': { action: '9,9'  } },
      ',': {
        '*': { action: { type: 'insert+p1', option: 'comma enumeration S' } } },
      '\\color{(...)}{(...)}1|\\color(...){(...)}2': {
        '*': { action: 'color-output' } },
      '\\color{(...)}0': {
        '*': { action: 'color0-output' } },
      '\\cjx{(...)}': {
        '*': { action: 'cjx' } },
      '\\,|\\x{}{}|\\x{}|\\x': {
        '*': { action: 'copy' } },
      'else2': {
        '*': { action: 'copy' } }
    }),
    actions: {
      'state of aggregation': function (buffer, m) {
          m = chemfigParser.go(m, 'o');
          return { type: 'state of aggregation subscript', p1: m };
      },
      'color-output': function (buffer, m) {
        return { type: 'color', color1: m[0], color2: chemfigParser.go(m[1], 'pq') };
      }
    }
  };
  //
  // Transitions and actions of bd parser
  //
  chemfigParser.stateMachines['bd'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': {} },
      'x$': {
        '0': { nextState: '!f', revisit: true } },
      'formula$': {
        '0': { nextState: 'f', revisit: true } },
      'else': {
        '0': { nextState: '!f', revisit: true } },
      '-9.,9 no missing 0': {
        '*': { action: '9,9' } },
      '.': {
        '*': { action: { type: 'insert', option: 'electron dot' } } },
      'a-z': {
        'f': { action: 'tex-math' } },
      'x': {
        '*': { action: { type: 'insert', option: 'KV x' } } },
      'letters': {
        '*': { action: 'rm' } },
      '\'': {
        '*': { action: { type: 'insert', option: 'prime' } } },
      '${(...)}$|$(...)$': {
        '*': { action: 'tex-math' } },
      '{(...)}': {
        '*': { action: 'text' } },
      '\\color{(...)}{(...)}1|\\color(...){(...)}2': {
        '*': { action: 'color-output' } },
      '\\color{(...)}0': {
        '*': { action: 'color0-output' } },
      '\\cjx{(...)}': {
        '*': { action: 'cjx' } },
      '\\,|\\x{}{}|\\x{}|\\x': {
        '*': { action: 'copy' } },
      'else2': {
        '*': { action: 'copy' } }
    }),
    actions: {
      'color-output': function (buffer, m) {
        return { type: 'color', color1: m[0], color2: chemfigParser.go(m[1], 'bd') };
      }
    }
  };
  //
  // Transitions and actions of oxidation parser
  //
  chemfigParser.stateMachines['oxidation'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': {} },
      'roman numeral': {
        '*': { action: 'roman-numeral' } },
      '${(...)}$|$(...)$': {
        '*': { action: 'tex-math' } },
      'else': {
        '*': { action: 'copy' } }
    }),
    actions: {
      'roman-numeral': function (buffer, m) { return { type: 'roman numeral', p1: m }; }
    }
  };
  //
  // Transitions and actions of tex-math parser
  //
  chemfigParser.stateMachines['tex-math'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': { action: 'output' } },
      '\\cjx{(...)}': {
        '*': { action: [ 'output', 'cjx' ] } },
      '{...}|\\,|\\x{}{}|\\x{}|\\x': {
        '*': { action: 'o=' } },
      'else': {
        '*': { action: 'o=' } }
    }),
    actions: {
      'output': function (buffer, m) {
        if (buffer.o) {
          var ret = { type: 'tex-math', p1: buffer.o };
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        }
        return null;
      }
    }
  };
  //
  // Transitions and actions of tex-math-tight parser
  //
  chemfigParser.stateMachines['tex-math tight'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': { action: 'output' } },
      '\\cjx{(...)}': {
        '*': { action: [ 'output', 'cjx' ] } },
      '{...}|\\,|\\x{}{}|\\x{}|\\x': {
        '*': { action: 'o=' } },
      '-|+': {
        '*': { action: 'tight operator' } },
      'else': {
        '*': { action: 'o=' } }
    }),
    actions: {
      'tight operator': function (buffer, m) { buffer.o = (buffer.o || "") + "{"+m+"}"; },
      'output': function (buffer, m) {
        if (buffer.o) {
          var ret = { type: 'tex-math', p1: buffer.o };
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        }
        return null;
      }
    }
  };
  //
  // Transitions and actions of 9,9 parser
  //
  chemfigParser.stateMachines['9,9'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': {} },
      ',': {
        '*': { action: 'comma' } },
      'else': {
        '*': { action: 'copy' } }
    }),
    actions: {
      'comma': function (buffer, m) { return { type: 'commaDecimal' }; }
    }
  };
  //
  //
  // \pu state machines
  //
  //
  // Transitions and actions of pu main parser
  //
  chemfigParser.stateMachines['pu'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': { action: 'output' } },
      '\{[(|)]\}': {
        '0|a': { action: 'copy' } },
      '(-)(9)^(-9)': {
        '0': { action: 'number^', nextState: 'a' } },
      '(-)(9.,9)(e)(99)': {
        '0': { action: 'enumber', nextState: 'a' } },
      'space': {
        '0|a': {} },
      'pm-operator': {
        '0|a': { action: { type: 'operator', option: '\\pm' }, nextState: '0' } },
      'operator': {
        '0|a': { action: 'copy', nextState: '0' } },
      '//': {
        'd': { action: 'o=', nextState: '/' } },
      '/': {
        'd': { action: 'o=', nextState: '/' } },
      '{...}|else': {
        '0|d': { action: 'd=', nextState: 'd' },
        'a': { action: [ 'space', 'd=' ], nextState: 'd' },
        '/|q': { action: 'q=', nextState: 'q' } }
    }),
    actions: {
      'enumber': function (buffer, m) {
        var ret = [];
        if (m[0] === "+-"  ||  m[0] === "+/-") {
          ret.push("\\pm ");
        } else if (m[0]) {
          ret.push(m[0]);
        }
        if (m[1]) {
          ret = chemfigParser.concatNotUndefined(ret, chemfigParser.go(m[1], 'pu-9,9'));
          if (m[2]) {
            if (m[2].match(/[,.]/)) {
              ret = chemfigParser.concatNotUndefined(ret, chemfigParser.go(m[2], 'pu-9,9'));
            } else {
              ret.push(m[2]);
            }
          }
          m[3] = m[4] || m[3];
          if (m[3]) {
            m[3] = m[3].trim();
            if (m[3] === "e"  ||  m[3].substr(0, 1) === "*") {
              ret.push({ type: 'cdot' });
            } else {
                ret.push({ type: 'times' });
            }
          }
        }
        if (m[3]) {
          ret.push("10^{"+m[5]+"}");
        }
        return ret;
      },
      'number^': function (buffer, m) {
        var ret = [];
        if (m[0] === "+-"  ||  m[0] === "+/-") {
          ret.push("\\pm ");
        } else if (m[0]) {
          ret.push(m[0]);
        }
        ret = chemfigParser.concatNotUndefined(ret, chemfigParser.go(m[1], 'pu-9,9'));
        ret.push("^{"+m[2]+"}");
        return ret;
      },
      'operator': function (buffer, m, p1) { return { type: 'operator', kind: (p1 || m) }; },
      'space': function (buffer, m) { return { type: 'pu-space-1' }; },
      'output': function (buffer, m) {
        var ret;
        var md = chemfigParser.matchh('{(...)}', buffer.d || "");
        if (md  &&  md.remainder === '') { buffer.d = md.matchh; }
        var mq = chemfigParser.matchh('{(...)}', buffer.q || "");
        if (mq  &&  mq.remainder === '') { buffer.q = mq.matchh; }
        if (buffer.d) {
            buffer.d = buffer.d.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
            buffer.d = buffer.d.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
        }
        if (buffer.q) {  // fraction
          buffer.d = chemfigParser.go(buffer.d, 'pu');
          buffer.q = buffer.q.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
          buffer.q = buffer.q.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
          buffer.q = chemfigParser.go(buffer.q, 'pu');
          if (buffer.o === '//') {
            ret = { type: 'pu-frac', p1: buffer.d, p2: buffer.q };
          } else {
            ret = buffer.d;
            if (buffer.d.length > 1  ||  buffer.q.length > 1) {
              ret = chemfigParser.concatNotUndefined(ret, { type: ' / ' });
            } else {
              ret = chemfigParser.concatNotUndefined(ret, { type: '/' });
            }
            ret = chemfigParser.concatNotUndefined(ret, buffer.q);
          }
        } else {  // no fraction
          ret = chemfigParser.go(buffer.d, 'pu-2');
        }
        for (var p in buffer) { delete buffer[p]; }
        return ret;
      }
    }
  };
  //
  // Transitions and actions of pu-2 parser
  //
  chemfigParser.stateMachines['pu-2'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '*': { action: 'output' } },
      '*': {
        '*': { action: [ 'output', 'cdot' ], nextState: '0' } },
      '\\x': {
        '*': { action: 'rm=' }, nextState: '1' },
      'space': {
        '*': { action: [ 'output', 'space' ], nextState: '0' } },
      '^{(...)}|^(-1)': {
        '1': { action: '^(-1)' } },
      '-9.,9': {
        '0': { action: 'rm=', nextState: '0' },
        '1': { action: '^(-1)', nextState: '0' } },
      '{...}|else': {
        '*': { action: 'rm=', nextState: '1' } }
    }),
    actions: {
      'cdot': function (buffer, m) { return { type: 'tight cdot' }; },
      '^(-1)': function (buffer, m) { buffer.rm += "^{"+m+"}"; },
      'space': function (buffer, m) { return { type: 'pu-space-2' }; },
      'output': function (buffer, m) {
        var ret;
        if (buffer.rm) {
          var mrm = chemfigParser.matchh('{(...)}', buffer.rm || "");
          if (mrm  &&  mrm.remainder === '') {
            ret = chemfigParser.go(mrm.matchh, 'pu');
          } else {
            ret = { type: 'rm', p1: buffer.rm };
          }
        }
        for (var p in buffer) { delete buffer[p]; }
        return ret;
      }
    }
  };
  //
  // Transitions and actions of 9,9 parser
  //
  chemfigParser.stateMachines['pu-9,9'] = {
    transitions: chemfigParser.createTransitions({
      'empty': {
        '0': { action: 'output-0' },
        'o': { action: 'output-o' } },
      ',': {
        '0': { action: [ 'output-0', 'comma' ], nextState: 'o' } },
      '.': {
        '0': { action: [ 'output-0', 'copy' ], nextState: 'o' } },
      'else': {
        '*': { action: 'text=' } }
    }),
    actions: {
      'comma': function (buffer, m) { return { type: 'commaDecimal' }; },
      'output-0': function (buffer, m) {
        var ret = [];
        if (buffer.text.length > 4) {
            var a = buffer.text.length % 3;
            if (a === 0) { a = 3; }
            for (var i=buffer.text.length-3; i>0; i-=3) {
              ret.push(buffer.text.substr(i, 3));
              ret.push({ type: '1000 separator' });
            }
            ret.push(buffer.text.substr(0, a));
            ret.reverse();
        } else {
            ret.push(buffer.text);
        }
        for (var p in buffer) { delete buffer[p]; }
        return ret;
      },
      'output-o': function (buffer, m) {
        var ret = [];
        if (buffer.text.length > 4) {
            var a = buffer.text.length - 3;
            for (var i=0; i<a; i+=3) {
              ret.push(buffer.text.substr(i, 3));
              ret.push({ type: '1000 separator' });
            }
            ret.push(buffer.text.substr(i));
        } else {
            ret.push(buffer.text);
        }
        for (var p in buffer) { delete buffer[p]; }
        return ret;
      }
    }
  };

  //
  //
  // Take MhchemParser output and convert it to TeX
  // (recursive)
  //
  //
  //======================== miura
  var texify = {
    types: {
      'chemfive': function (buf) {
        var res = "";
        buf.a = texify.go2(buf.a);
        buf.b = texify.go2(buf.b);
        buf.p = texify.go2(buf.p);
        buf.o = texify.go2(buf.o);
        buf.q = texify.go2(buf.q);
        buf.d = texify.go2(buf.d);
        //
        // a
        //
        if (buf.a) {
          //alert("BUF.a= "+buf.a);//-- miura
          if (buf.a.match(/^[+\-]/)) { buf.a = "{"+buf.a+"}"; }
          res += buf.a + "\\,";
        }
        //
        // b and p
        //
        if (buf.b || buf.p) {
          //alert("BUF.b= "+buf.b);//-- miura
          res += "{\\vphantom{X}}";
          res += "^{\\hphantom{"+(buf.b||"")+"}}_{\\hphantom{"+(buf.p||"")+"}}";
          res += "{\\vphantom{X}}";
          res += "^{\\smash[t]{\\vphantom{2}}\\llap{"+(buf.b||"")+"}}";
          res += "_{\\vphantom{2}\\llap{\\smash[t]{"+(buf.p||"")+"}}}";
        }
        //
        // o
        //
        if (buf.o) {
          //alert("BUF.o= "+buf.o);//-- miura
          if (buf.o.match(/^[+\-]/)) { buf.o = "{"+buf.o+"}"; }
          res += buf.o;
        }
        //
        // q and d
        //
        if (buf['d-type'] === 'kv') {
          if (buf.d || buf.q) {
            res += "{\\vphantom{X}}";
          }
          if (buf.d) {
            res += "^Y1{"+buf.d+"}";
          }
          if (buf.q) {
            res += "_{\\smash[t]{"+buf.q+"}}";
          }
        } else if (buf['d-type'] === 'oxidation') {
          if (buf.d) {
            res += "{\\vphantom{X}}";
            res += "^Y2{"+buf.d+"}";
          }
          if (buf.q) {
            res += "{\\vphantom{X}}";
            res += "_{\\smash[t]{"+buf.q+"}}";
          }
        } else {
          if (buf.q) {
            res += "{\\vphantom{X}}";
            res += "_{\\smash[t]{"+buf.q+"}}";
          }
          if (buf.d) {
            res += "{\\vphantom{X}}";
            //-- Modified by miura
            //res += "^{"+buf.d+"}Y3"; //-- Modified by miura
            res += "^{"+buf.d+"}";
          }
        }
        return res;
      },
      'rm': function (buf) { return "\\mathrm{"+buf.p1+"}"; },
      'text': function (buf) {
        if (buf.p1.match(/[\^_]/)) {
          buf.p1 = buf.p1.replace(" ", "~").replace("-", "\\text{-}");
          return "\\mathrm{"+buf.p1+"}";
        } else {
          return "\\text{"+buf.p1+"}";
        }
      },
      'roman numeral': function (buf) { return "\\mathrm{"+buf.p1+"}"; },
      'state of aggregation': function (buf) { return "\\mskip2mu "+texify.go2(buf.p1); },
      'state of aggregation subscript': function (buf) { return "\\mskip1mu "+texify.go2(buf.p1); },
      'bond': function (buf) {
        var ret = texify.bonds[buf.kind];
        if (!ret) {
          throw ["MhchemErrorBond", "chemfig Error. Unknown bond type (" + buf.kind + ")"];
        }
        return ret;
      },
      'frac': function (buf) {
          var c = "\\frac{" + buf.p1 + "}{" + buf.p2 + "}";
          return "\\mathchoice{\\textstyle"+c+"}{"+c+"}{"+c+"}{"+c+"}";
       },
      'pu-frac': function (buf) {
          var c = "\\frac{" + texify.go2(buf.p1) + "}{" + texify.go2(buf.p2) + "}";
          return "\\mathchoice{\\textstyle"+c+"}{"+c+"}{"+c+"}{"+c+"}";
       },
      'tex-math': function (buf) { return buf.p1 + " "; },
      'frac-ce': function (buf) {
        return "\\frac{" + texify.go2(buf.p1) + "}{" + texify.go2(buf.p2) + "}";
      },
      'overset': function (buf) {
        return "\\overset{" + texify.go2(buf.p1) + "}{" + texify.go2(buf.p2) + "}";
      },
      'underset': function (buf) {
        return "\\underset{" + texify.go2(buf.p1) + "}{" + texify.go2(buf.p2) + "}";
      },
      'underbrace': function (buf) {
        return "\\underbrace{" + texify.go2(buf.p1) + "}_{" + texify.go2(buf.p2) + "}";
      },
      'color': function (buf) {
        return "{\\color{" + buf.color1 + "}{" + texify.go2(buf.color2) + "}}";
      },
      'color0': function (buf) {
        return "\\color{" + buf.color + "}";
      },
      'arrow': function (buf) {
        buf.rd = texify.go2(buf.rd);
        buf.rq = texify.go2(buf.rq);
        var arrow = texify.arrows[buf.r];
        if (buf.rd || buf.rq) {
          if (buf.r === "<=>"  ||  buf.r === "<=>>"  ||  buf.r === "<<=>"  ||  buf.r === "<-->") {
            // arrows that cannot stretch correctly yet, https://github.com/mathjax/MathJax/issues/1491
            arrow = "\\long"+arrow;
            if (buf.rd) { arrow = "\\overset{"+buf.rd+"}{"+arrow+"}"; }
            if (buf.rq) { arrow = "\\underset{\\lower7mu{"+buf.rq+"}}{"+arrow+"}"; }
            arrow = " {}\\mathrel{"+arrow+"}{} ";
          } else {
            if (buf.rq) { arrow += "[{"+buf.rq+"}]"; }
            arrow += "{"+buf.rd+"}";
            arrow = " {}\\mathrel{\\x"+arrow+"}{} ";
          }
        } else {
          arrow = " {}\\mathrel{\\long"+arrow+"}{} ";
        }
        return arrow;
      },
      'operator': function (buf) { return texify.operators[buf.kind]; }
    },
    arrows: {
      "->": "rightarrow",
      "\u2192": "rightarrow",
      "\u27F6": "rightarrow",
      "<-": "leftarrow",
      "<->": "leftrightarrow",
      "<-->": "leftrightarrows",
      "<=>": "rightleftharpoons",
      "\u21CC": "rightleftharpoons",
      "<=>>": "Rightleftharpoons",
      "<<=>": "Leftrightharpoons"
    },
    bonds: {
      "-": "{-}",
      "1": "{-}",
      "=": "{=}",
      "2": "{=}",
      //-- Modified for ChemJax
      //"#": "{\\equiv}",
      "#": "{#}",
      //-- end of modified
      "3": "{\\equiv}",
      "~": "{\\tripledash}",
      "~-": "{\\rlap{\\lower.1em{-}}\\raise.1em{\\tripledash}}",
      "~=": "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{\\tripledash}}-}",
      "~--": "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{\\tripledash}}-}",
      "-~-": "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{-}}\\tripledash}",
      "...": "{{\\cdot}{\\cdot}{\\cdot}}",
      "....": "{{\\cdot}{\\cdot}{\\cdot}{\\cdot}}",
      "->": "{\\rightarrow}",
      "<-": "{\\leftarrow}",
    //-- Modified on 20190119
      //"<": "{<}",
      "<": "{<}",
      //">": "{>}"
      ">": "{>}"
    },
    entities: {
      'space': " ",
      'entitySkip': "~",
      'pu-space-1': "~",
      'pu-space-2': "\\mkern3mu ",
      '1000 separator': "\\mkern2mu ",
      'commaDecimal': "{,}",
      'comma enumeration L': "{{0}}\\mkern6mu ",
      'comma enumeration M': "{{0}}\\mkern3mu ",
      'comma enumeration S': "{{0}}\\mkern1mu ",
      'hyphen': "\\text{-}",
      'addition compound': "\\,{\\cdot}\\,",
      'electron dot': "\\mkern1mu \\bullet\\mkern1mu ",
      'KV x': "{\\times}",
      'prime': "\\prime ",
      'cdot': "\\cdot ",
      'tight cdot': "\\mkern1mu{\\cdot}\\mkern1mu ",
      'times': "\\times ",
      'circa': "{\\sim}",
      '^': "uparrow",
      'v': "downarrow",
      'ellipsis': "\\ldots ",
      '/': "/",
      ' / ': "\\,/\\,",
      '1st-level escape': "{0} "  // &, \\\\, \\hline
    },
    operators: {
      "+": " {}+{} ",
      "-": " {}-{} ",
      "=": " {}={} ",
      "<": " {}<{} ",
      ">": " {}>{} ",
      "<<": " {}\\ll{} ",
      ">>": " {}\\gg{} ",
      "\\pm": " {}\\pm{} ",
      "\\approx": " {}\\approx{} ",
      "$\\approx$": " {}\\approx{} ",
      "v": " \\downarrow{} ",
      "(v)": " \\downarrow{} ",
      "^": " \\uparrow{} ",
      "(^)": " \\uparrow{} "
    },

    go: function (input, isInner) {
      if (!input) { return input; }
      var res = "";
      var cee = false;
      for (var i=0; i<input.length; i++) {
        var inputi = input[i];
        if (typeof inputi === "string") {
          res += inputi;
        } else if (this.types[inputi.type]) {
          res += this.types[inputi.type](inputi);
        } else if (this.entities[inputi.type]) {
          var a = this.entities[inputi.type];
          a = a.replace("{0}", inputi.p1 || "");
          a = a.replace("{1}", inputi.p2 || "");
          res += a;
          if (inputi.type === '1st-level escape') { cee = true; }
        } else {
          throw ["MhchemBugT", "chemfig bug T. Please report."];  // Missing texify rule or unknown MhchemParser output
        }
      }
      if (!isInner && !cee) {
        res = "{" + res + "}";
      }
      return res;
    },
    go2: function(input) {
      return this.go(input, true);
    }
  };

  MathJax.Extension["TeX/chemfig"].CJX = CJX;

  /***************************************************************************/

  TEX.Definitions.Add({
    macros: {
      //
      //  Set up the macros for chemistry
      //
      cjx:   "CJX",
      pu:   "PU",

      //
      //  Make these load AMSmath package (redefined below when loaded)
      //
      xleftrightarrow:    ["Extension","AMSmath"],
      xrightleftharpoons: ["Extension","AMSmath"],
      xRightleftharpoons: ["Extension","AMSmath"],
      xLeftrightharpoons: ["Extension","AMSmath"],

      //  FIXME:  These don't work well in FF NativeMML mode
      longrightleftharpoons: ["Macro","\\stackrel{\\textstyle{-}\\!\\!{\\rightharpoonup}}{\\smash{{\\leftharpoondown}\\!\\!{-}}}"],
      longRightleftharpoons: ["Macro","\\stackrel{\\textstyle{-}\\!\\!{\\rightharpoonup}}{\\smash{\\leftharpoondown}}"],
      longLeftrightharpoons: ["Macro","\\stackrel{\\textstyle\\vphantom{{-}}{\\rightharpoonup}}{\\smash{{\\leftharpoondown}\\!\\!{-}}}"],
      longleftrightarrows: ["Macro","\\stackrel{\\longrightarrow}{\\smash{\\longleftarrow}\\Rule{0px}{.25em}{0px}}"],

      //
      //  Needed for \bond for the ~ forms
      //  Not perfectly aligned when zoomed in, but on 100%
      //
      tripledash: ["Macro","\\vphantom{-}\\raise2mu{\\kern2mu\\tiny\\text{-}\\kern1mu\\text{-}\\kern1mu\\text{-}\\kern2mu}"]
    },
  },null,true);

  if (!MathJax.Extension["TeX/AMSmath"]) {
    TEX.Definitions.Add({
      macros: {
        xrightarrow: ["Extension","AMSmath"],
        xleftarrow:  ["Extension","AMSmath"]
      }
    },null,true);
  }

  //
  //  These arrows need to wait until AMSmath is loaded
  //
  MathJax.Hub.Register.StartupHook("TeX AMSmath Ready",function () {
    TEX.Definitions.Add({
      macros: {
        //
        //  Some of these are hacks for now
        //
        xleftrightarrow:    ["xArrow",0x2194,6,6],
        xrightleftharpoons: ["xArrow",0x21CC,5,7],  // FIXME:  doesn't stretch in HTML-CSS output
        xRightleftharpoons: ["xArrow",0x21CC,5,7],  // FIXME:  how should this be handled?
        xLeftrightharpoons: ["xArrow",0x21CC,5,7]
      }
    },null,true);
  });

  TEX.Parse.Augment({

    //
    //  Implements \cjx and friends
    //
    CJX: function (name) {
      var arg = this.GetArgument(name);
      var tex = CJX(arg).Parse();
      this.string = tex + this.string.substr(this.i); this.i = 0;
    },

    PU: function (name) {
      var arg = this.GetArgument(name);
      var tex = CJX(arg).Parse('pu');
      this.string = tex + this.string.substr(this.i); this.i = 0;
    }

  });

  //
  //  Indicate that the extension is ready
  //
  MathJax.Hub.Startup.signal.Post("TeX chemfig3 Ready");

});

MathJax.Ajax.loadComplete("[ChemJax]/chemfig3.js");
