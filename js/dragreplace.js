/**
 * Repalce element with `Drag and Drop`
 * Ver 0.1
 *
 * @author Kazuya Hiruma
 */

(function (win, doc) {

'use strict';

/**
 * @namespace ddReplace
 */
var ddReplace = {};

/////////////////////////////////////////////////////////////////////////////////////

/* ----------------------------------------
   PRIVATE PROPERTY
------------------------------------------- */
var isTouch = ('ontouchstart' in win),
    MouseEvent = {
        CLICK:      isTouch ? 'touchstart' : 'click',
        MOUSE_UP:   isTouch ? 'touchend'   : 'mouseup',
        MOUSE_DOWN: isTouch ? 'touchstart' : 'mousedown',
        MOUSE_MOVE: isTouch ? 'touchmove'  : 'mousemove'
    };

/////////////////////////////////////////////////////////////////////////////////////

/* ----------------------------------------
   PRIVATE METHOD
------------------------------------------- */
function getEventObject(e) {

    return (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0]) || (e.touches && e.touches[0]) || e;
}

/**
 * Replace element ele1 to ele2
 * @name replaceElement
 * @function
 * @param ele1 Replace from `hitElement`
 * @param ele2 Replace to `draggingElement`
 * @return {Element} replaced element.
 */
function replaceElement(ele1, ele2) {

    if (ele1 === ele2) {
        return null;
    }

    var self = this,
        ele1Next = getNextSibling(ele1),
        ele2Next = getNextSibling(ele2),
        ele1Parent = ele1.parentNode,
        ele2Parent = ele2.parentNode,
        ele1Cp = ele1.cloneNode(true),
        ele2Cp = ele2.cloneNode(true),

        //get client rect
        ele1Rect = ele1.getBoundingClientRect(),
        ele2Rect = ele2.getBoundingClientRect();

    $(ele1).css('visibility', 'hidden');
    $(ele2).css('visibility', 'hidden');

    $(ele1Cp).addClass('replaceItemMove').css({
        'width': $(ele1).outerWidth(),
        '-webkit-transform': 'translate3d(' + ele1Rect.left + 'px, ' + ele1Rect.top + 'px, 0)'
    }).bind('webkitTransitionEnd', function (e) {
    
        $(ele1).css('visibility', 'visible');
        $(this).remove();
    });

    $(ele2Cp).addClass('replaceItemMove').css({
        'width': $(ele2).outerWidth(),
        '-webkit-transform': 'translate3d(' + ele2Rect.left + 'px, ' + ele2Rect.top + 'px, 0)'
    }).bind('webkitTransitionEnd', function (e) {
    
        $(ele2).css('visibility', 'visible');
        $(this).remove();

        self.trigger('replaced', {
            from: ele1,
            to: ele2
        });
    });

    // move motion execute without event loop
    setTimeout(function () {
    
        $(ele1Cp).css({
            '-webkit-transform': 'translate3d(' + ele2Rect.left + 'px, ' + ele2Rect.top + 'px, 0)'
        });

        $(ele2Cp).css({
            '-webkit-transform': 'translate3d(' + ele1Rect.left + 'px, ' + ele1Rect.top + 'px, 0)'
        });
    }, 0);

    document.body.appendChild(ele1Cp);
    document.body.appendChild(ele2Cp);

    // replace execute
    if (ele1Next === null) {
        ele1Parent.appendChild(ele2);
    }
    else {
        ele1Parent.insertBefore(ele2, ele1Next);
    }

    if (ele2Next === null) {
        ele2Parent.appendChild(ele1);
    }
    else {
        ele2Parent.insertBefore(ele1, ele2Next);
    }
}

/**
 * get next sibling as `Node`
 * @name getNextSibling
 * @function
 * @param ele 
 * @return 
 */
function getNextSibling(ele) {
    
    var res = ele.nextSibling;
    
    while(res && res.nodeType !== 1) {
        res = res.nextSibling;
    }

    if (!res) {
        return null;
    }
    
    return res;
}

/////////////////////////////////////////////////////////////////////////////////////

/**
 * @name draggable
 * @function
 * @param elements 
 * @param config 
 */
function Replaceable($elements, config) {

    this.init.apply(this, arguments);
}

Replaceable.prototype = {
    init: function ($elements, config) {

        var self = this,
            startPos = {};

        // set value
        this.startPos      = startPos;
        this.currentClone  = null;
        this.currentTarget = null;

        // setting `Replaceable`
        $elements.each(function (i, val) {

             /**
              * @name hitCheck
              * @private
              * @function
              * @param {Object} pos moving center position object.
              */
            function hitCheck(pos) {
            
                var $val = $(val),
                    rect = val.getBoundingClientRect();

                // hit check
                if (
                  (rect.left <= pos.x && rect.right >= pos.x) &&
                  (rect.top <= pos.y && rect.bottom >= pos.y)
                ) {
                    $val.addClass('hit');
                }
                else {
                    $val.removeClass('hit');
                }
            }

            /////////////////////////////////////////////////////////

            $(val)
                .addClass('replaceable')
                .append('<span class="dragger" />')
                .bind(MouseEvent.MOUSE_DOWN, function (e) {

                    var evt = getEventObject(e),
                        offset = this.getBoundingClientRect();

                    if (!$(e.target).hasClass('dragger')) {
                        return;
                    }

                    if (self.currentClone || self.currentTarget) {
                        return;
                    }

                    // create clone of target element.
                    self.currentClone = $(this)
                        .clone()
                        .addClass('dragTarget')
                        .css({
                            'width': $(this).outerWidth(),
                            'left':  offset.left,
                            'top':   offset.top,
                            '-webkit-transform': 'translate3d(-2px, -2px, 0)'
                        })
                        .appendTo(document.body);

                    // save current target.
                    self.currentTarget = $(e.currentTarget)
                        .addClass('dragging');

                    self.startPos.x = evt.pageX;
                    self.startPos.y = evt.pageY;

                    return false;
                });

            //bind event to global of replaceable
            self.bind('move', hitCheck);
        });

        // set events to `document`
        $(document)
            .bind(MouseEvent.MOUSE_MOVE, function (e) {
            
                var evt, offset, curPos = {}, hitElement;

                if (!self.currentClone) {
                    return true;
                }

                evt = getEventObject(e);
                offset = self.currentClone[0].getBoundingClientRect();

                curPos.x = startPos.x - evt.pageX;
                curPos.y = startPos.y - evt.pageY;

                self.currentClone.css({
                    '-webkit-transition': '0ms',
                    '-webkit-transform': 'translate3d(' + -curPos.x + 'px, ' + -curPos.y +'px, 0)'
                });

                //dispatch `move` event.
                self.trigger('move', {
                    x: (offset.left + offset.right) / 2,
                    y: (offset.top + offset.bottom) /2
                });
            })
            .bind(MouseEvent.MOUSE_UP, function (e) {
            
                var evt, hitElement;

                if (!self.currentClone) {
                    return true;
                }

                // replace
                if ((hitElement = $('.replaceable.hit').removeClass('hit')[0])) {
                    self.replaceElement(hitElement, self.currentTarget[0]);
                    self.currentClone.remove();
                    self.currentClone = null;
                    self.currentTarget.removeClass('dragging');
                    self.currentTarget = null;
                }

                // not replace, and move to default position with transition.
                else {
                    self.currentClone.one('webkitTransitionEnd', function (e) {

                        $(this).remove();
                        self.currentTarget.removeClass('dragging');
                        self.currentTarget = null;
                    })
                    .css({
                        '-webkit-transition-duration': '0.3s',
                        '-webkit-transform': 'translate3d(0, 0, 0)'
                    });

                    self.currentClone = null;
                }
            });
    },

    replaceElement: replaceElement
};

//inheritance Emit Event class.
EvtEmit.attach(Replaceable.prototype);

/////////////////////////////////////////////////////////////////////////////////////

/* ----------------------------------------
   Exports
------------------------------------------- */
ddReplace.Replaceable = Replaceable;
ddReplace.replaceElement = replaceElement;
win.ddReplace = ddReplace;

}(window, document));