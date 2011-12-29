# Read me

## dragreplace is jQuery Plugin.

This plugin is jQuery plugin.
work on the WebKit only.


## Example
<pre class="js">

/* ---------------------------------------------------------------
 *  Replaceable to jQuery objects and grouping.
 *  Replaced only objects with specified by selectors.
 * --------------------------------------------------------------- */
var replaceable = $('.replaceableList li').replaceable();

/* ---------------------------------------------------------------
 *  You can use custom event as 'replaced'.
 *  Return objects is replaced from/to elements.
 *  
 *  Example:
 *  replaceableObject.bind('replaced', function (evt, replaceElements) {
 *      //replaceElements.from
 *      //replaceElements.to
 *  });
 * --------------------------------------------------------------- */
$('.attachEvent').click(function () {

    replaceable.bind('replaced', function (event, replaceElements) {

        alert('Replaced!');
        console.log('form: ', replaceElement.froms, 'to: ', replaceElements.to);
    });
});
</pre>
