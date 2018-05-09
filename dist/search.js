'use strict';

/*
 报表的查询条件根据配置显示
 配置项：
 type:  条件的类型(选择其中一个) radio
 input,      输入框
 select,     选择框
 selectMul,  选择框（多选）
 date,       日期
 scope       范围
 label:  条件的显示内容 string
 placeholder:  条件的提示内容 string
 field:   与数据库字段的关联关系（列出数据库所有字段的列含义，选择其中一个。例如：选择姓名，则 field=name） string
 value:   要显示的下拉框的值，逗号分隔（例如港口列表或者状态列表）
 */
/*var filters = [{
 type: 'input',
 label: '姓名',
 placeholder: '请输入姓名',
 field: 'name',
 value: '',
 },
 {
 type: 'select',
 label: '性别',
 placeholder: '请选择性别',
 field: 'sex',
 value: "1=男,2=女",//[{key:"1",val:"男"},{key:"2",val:"女"}]
 },
 {
 type: 'select_mul',
 label: '港口',
 placeholder: '',
 field: 'port',
 value: "1=港口一,2=港口二"//[{key:"1",val:"港口一"},{key:"2",val:"港口二"}],
 },
 {
 type: 'date',
 label: '日期',
 placeholder: '请选择日期',
 field: 'createDate',
 value: '',
 },
 {
 type: 'scope',
 label: '年龄',
 placeholder: '请输入年龄范围',
 field: 'age',
 value: '',
 }];*/

Vue.component("cue-info", {
    props: ['retype'],
    template: '<div class="cueInfo">\n                <p class="first">\u4F8B\uFF1A\u8F93\u5165\u683C\u5F0F\u5982\u4E0B</p>\n                <div v-if="retype==\'1\'">\n                    <p><b>\u5E74</b>\uFF1A2012 \u6216 2012-2013</p>\n                    <p class="nbsp">2012,2015,2017</p>\n                </div>\n                <div v-if="retype==\'2\'">\n                    <p><b>\u5B63</b>\uFF1A201201,201202</p>\n                    <p class="nbsp">201201-201204</p>\n                </div>\n                <div v-if="retype==\'3\'">\n                    <p><b>\u6708</b>\uFF1A201204,201206</p>\n                    <p class="nbsp">201204-201206</p>\n                </div>\n                <div v-if="retype==\'4\'">\n                    <p><b>\u5468</b>\uFF1A201204,201226</p>\n                    <p class="nbsp">201204-201226</p>\n                </div>\n                <div v-if="retype==\'5\'">\n                    <p><b>\u65E5</b>\uFF1A20120101,20120304 </p>\n                    <p class="nbsp">20120101-20120304</p>\n                </div>\n                <div v-if="retype==\'6\'">\n                    <p><b>\u5C0F\u65F6</b>\uFF1A20120101 01,20120911 02</p>\n                    <p class="nbsp">20120101 01-20120911 02</p>\n                </div>\n            </div>',
    methods: {}
});

var vm = new Vue({
    el: '#selectWrap',
    data: {
        reportType: "3"
    },
    methods: {
        changeType: function changeType(e) {
            this.reportType = e.target.value;
            console.log(this.reportType);
        }
    }
});

Vue.component('search-form', {
    props: ['filters', 'report'],
    template: '<div class="report_filter">\n                    <form role="form" class="form-horizontal col-sm-12" :id="\'form_\'+report.id" @submit.prevent="submitForm">\n                        <div class="" v-for="(filter,index) in filters" v-if="index<2">\n                          <search-input v-if="filter.type === \'input\'" v-bind:item="filter"></search-input>\n                          <search-scope v-if="filter.type === \'scope\'" v-bind:item="filter"></search-scope>\n                          <search-select v-if="filter.type === \'select\'" v-bind:item="filter"></search-select>\n                          <search-selectMul v-if="filter.type === \'select_mul\'" v-bind:item="filter"></search-selectMul>\n                        </div>\n                        <div class="" v-for="(filter,index) in filters" v-if="index>=2">\n                          <search-input v-if="filter.type === \'input\'" v-bind:item="filter"></search-input>\n                          <search-scope v-if="filter.type === \'scope\'" v-bind:item="filter"></search-scope>\n                          <search-select v-if="filter.type === \'select\'" v-bind:item="filter"></search-select>\n                          <search-selectMul v-if="filter.type === \'select_mul\'" v-bind:item="filter"></search-selectMul>\n                        </div>\n                    </form>\n                    <!--<div v-if="filters.length>2" class="col-lg-1"></div>-->\n                </div>',
    mounted: function mounted() {},

    methods: {}

});

Vue.component('search-input', {
    props: ['item'],
    template: '<div class="top col-sm-6" >\n              <label class="col-xs-3 control-label">{{item.label}}</label>\n              <div class="">\n                <input type="text" class="inputCss col-xs-6" v-bind:name="item.field" :value="item.value" v-bind:placeholder="item.placeholder" />\n              </div>\n            </div>\n          ',
    methods: {}
});
Vue.component('search-select', {
    props: ['item'],
    template: '<div class="top col-sm-6">\n                  <label class="col-xs-3 control-label">{{item.label}}</label>\n                  <div class="selectsDiv ">\n                    <select class="selectInit" v-bind:name="item.field" v-bind:placeholder="item.placeholder" >\n                      <option value="">\u8BF7\u9009\u62E9</option>\n                      <option v-for="childItem in item.value" v-bind:value="childItem.key">{{childItem.val}}</option>\n                    </select>\n                  </div>\n                </div>'
});
Vue.component('search-date', {
    props: ['item'],
    template: '<div class=" form-group">\n                  <label class="col-xs-3 control-label">{{item.label}}</label>\n                  <div class="input-group col-xs-4">\n                    <input type="date" class="form-control" v-bind:name="item.field" v-bind:placeholder="item.placeholder" />\n                  </div>\n                </div>'
});
Vue.component('search-scope', {
    props: ['item'],
    template: '<div class="top col-sm-6">\n                  <label class="col-xs-3 control-label ptop">{{item.label}}</label>\n                  <div class="input-group ">\n                    <input type="text" class="inputCss " v-bind:name="item.field + \'1\'" v-bind:placeholder="item.placeholder" /><input type="text" class="inputCss " v-bind:name="item.field + \'2\'" v-bind:placeholder="item.placeholder" />\n                  </div>\n                </div> '
});

Vue.component('search-selectMul', {
    props: ['item'],
    template: '<div class="top col-sm-6">\n                  <label class="col-xs-3 control-label">{{item.label}}</label>\n                  <div class="selectsDiv ">\n                    <select class="selectInit" v-bind:name="item.field" v-bind:placeholder="item.placeholder" multiple="multiple">\n                      <option v-for="childItem in item.value" v-bind:value="childItem.key">{{childItem.val}}</option>\n                    </select>\n                  </div>\n                </div>\n          '
});

function filterValue(filters) {
    //将  "3,4,5 值变为 [{key:"3",val:"3"},{key:"4",val:"4"},{key:"5",val:"5"}]
    filters.forEach(function (item, index) {
        if (item.type === "data_filter") {
            if (!$.reportGtstar.filterMap[item.field]) {
                $.reportGtstar.filterMap[item.field] = item.value;
            }
        }
        if ((item.type === "select" || item.type === "select_mul") && typeof item.value === "string") {
            (function () {
                var temp = [],
                    valArr = item.value.split(",");

                var _loop = function _loop(_index) {
                    if (valArr[_index]) {
                        if (item.field && item.field == "neid") {
                            $.reportGtstar.dataFilterList.forEach(function (obj, i) {
                                if (valArr[_index] == obj.id) {
                                    temp.push({ key: valArr[_index], val: obj.neName });
                                }
                            });
                        } else {
                            temp.push({ key: valArr[_index], val: valArr[_index] });
                        }
                    }
                };

                for (var _index in valArr) {
                    _loop(_index);
                }

                filters[index]['value'] = temp;
            })();
        }
    });
    // console.log(filters)
    return filters;
}

if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}