'use strict';

(function ($) {
    'use strict';

    $.reportUtil = $.reportUtil || {};

    $.extend($.reportUtil, {
        /* 处理转义字符*/
        handleEscape: function handleEscape(value) {
            // Handle escape characters. Done separately from the tokenizing loop below because escape characters are
            // active in quoted strings.
            var i = 0;
            while ((i = value.indexOf('\\', i)) != -1) {
                if (value.charAt(i + 1) == 't') {
                    value = value.substring(0, i) + '\t' + value.substring(i++ + 2); // tab
                } else if (value.charAt(i + 1) == 'r') {
                    value = value.substring(0, i) + '\r' + value.substring(i++ + 2); // return
                } else if (value.charAt(i + 1) == 'n') {
                    value = value.substring(0, i) + '\n' + value.substring(i++ + 2); // line feed
                } else if (value.charAt(i + 1) == 'f') {
                    value = value.substring(0, i) + '\f' + value.substring(i++ + 2); // form feed
                } else if (value.charAt(i + 1) == '\\') {
                    value = value.substring(0, i) + '\\' + value.substring(i++ + 2); // \
                } else {
                    value = value.substring(0, i) + value.substring(i + 1); // Quietly drop the character
                }
            }
            return value;
        },
        /*处理单引号 问题*/
        handleQuotes: function handleQuotes(value) {
            // Handle quotes
            if (i == value.length - 1) {
                value = value.substring(0, i); // Silently drop the trailing quote
            } else if (value.charAt(i + 1) == '\'') {
                value = value.substring(0, i) + value.substring(++i); // Escaped quote
            } else {
                // Quoted string
                var j = i + 2;
                while ((j = value.indexOf('\'', j)) != -1) {
                    if (j == value.length - 1 || value.charAt(j + 1) != '\'') {
                        // Found start and end quotes. Remove them
                        value = value.substring(0, i) + value.substring(i + 1, j) + value.substring(j + 1);
                        i = j - 1;
                        break;
                    } else {
                        // Found a double quote, reduce to a single quote.
                        value = value.substring(0, j) + value.substring(++j);
                    }
                }

                if (j == -1) {
                    // There is no end quote. Drop the start quote
                    value = value.substring(0, i) + value.substring(i + 1);
                }
            }
        },
        /*替换掉占位符（非字符串内容）, 例如：[test, 1, by 0] 替换掉非字符串的内容*/
        replaceHolder: function replaceHolder(value, params) {
            if (value.length === 0) {
                return "";
            }
            if (value.length == 1 && typeof value[0] == "string") {
                return value[0];
            }

            var phvList;
            if (params.length == 2 && $.isArray(params[1])) {
                phvList = params[1];
            }
            var str = "";
            for (var i = 0, j = value.length; i < j; i++) {
                if (typeof value[i] == "string") {
                    str += value[i];
                } else if (phvList && value[i] < phvList.length) {
                    // Must be a number
                    str += phvList[value[i]];
                } else if (!phvList && value[i] + 1 < params.length) {
                    str += params[value[i] + 1];
                } else {
                    str += "{" + value[i] + "}";
                }
            }
            return str;
        },
        handleProp: function handleProp(value) {
            if (typeof value == 'string') {
                //value = this.handleEscape(value);//处理转义

                var arr = [],
                    j,
                    index,
                    i = 0;
                while (i < value.length) {
                    /*if (value.charAt(i) == '\'') {
                      value = this.handleQuotes(value);
                    } */
                    if (value.charAt(i) == '{') {
                        // Beginning of an unquoted place holder.
                        j = value.indexOf('}', i + 1);
                        if (j == -1) {
                            i++; // No end. Process the rest of the line. Java would throw an exception
                        } else {
                            // Add 1 to the index so that it aligns with the function arguments.
                            index = parseInt(value.substring(i + 1, j));
                            if (!isNaN(index) && index >= 0) {
                                // Put the line thus far (if it isn't empty) into the array
                                var s = value.substring(0, i);
                                if (s !== "") {
                                    arr.push(s);
                                }
                                // Put the parameter reference into the array
                                arr.push(index);
                                // Start the processing over again starting from the rest of the line.
                                i = 0;
                                value = value.substring(j + 1);
                            } else {
                                i = j + 1; // Invalid parameter. Leave as is.
                            }
                        }
                    } else {
                        i++;
                    }
                } // while
                // Put the remainder of the no-empty line into the array.
                if (value !== "") {
                    arr.push(value);
                }
                value = arr;
            }
            return this.replaceHolder(value, arguments);
        }
    });
})(jQuery);