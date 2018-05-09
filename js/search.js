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
    template: `<div class="cueInfo">
                <p class="first">例：输入格式如下</p>
                <div v-if="retype=='1'">
                    <p><b>年</b>：2012 或 2012-2013</p>
                    <p class="nbsp">2012,2015,2017</p>
                </div>
                <div v-if="retype=='2'">
                    <p><b>季</b>：201201,201202</p>
                    <p class="nbsp">201201-201204</p>
                </div>
                <div v-if="retype=='3'">
                    <p><b>月</b>：201204,201206</p>
                    <p class="nbsp">201204-201206</p>
                </div>
                <div v-if="retype=='4'">
                    <p><b>周</b>：201204,201226</p>
                    <p class="nbsp">201204-201226</p>
                </div>
                <div v-if="retype=='5'">
                    <p><b>日</b>：20120101,20120304 </p>
                    <p class="nbsp">20120101-20120304</p>
                </div>
                <div v-if="retype=='6'">
                    <p><b>小时</b>：20120101 01,20120911 02</p>
                    <p class="nbsp">20120101 01-20120911 02</p>
                </div>
            </div>`,
    methods: {}
});

var vm = new Vue({
    el: '#selectWrap',
    data: {
        reportType: "3"
    },
    methods: {
        changeType: function (e) {
            this.reportType = e.target.value;
            console.log(this.reportType);
        }
    }
});


Vue.component('search-form', {
    props: ['filters', 'report'],
    template: `<div class="report_filter">
                    <form role="form" class="form-horizontal col-sm-12" :id="'form_'+report.id" @submit.prevent="submitForm">
                        <div class="" v-for="(filter,index) in filters" v-if="index<2">
                          <search-input v-if="filter.type === 'input'" v-bind:item="filter"></search-input>
                          <search-scope v-if="filter.type === 'scope'" v-bind:item="filter"></search-scope>
                          <search-select v-if="filter.type === 'select'" v-bind:item="filter"></search-select>
                          <search-selectMul v-if="filter.type === 'select_mul'" v-bind:item="filter"></search-selectMul>
                        </div>
                        <div class="" v-for="(filter,index) in filters" v-if="index>=2">
                          <search-input v-if="filter.type === 'input'" v-bind:item="filter"></search-input>
                          <search-scope v-if="filter.type === 'scope'" v-bind:item="filter"></search-scope>
                          <search-select v-if="filter.type === 'select'" v-bind:item="filter"></search-select>
                          <search-selectMul v-if="filter.type === 'select_mul'" v-bind:item="filter"></search-selectMul>
                        </div>
                    </form>
                    <!--<div v-if="filters.length>2" class="col-lg-1"></div>-->
                </div>`,
    mounted() {

    },
    methods: {},

});

Vue.component('search-input', {
    props: ['item'],
    template: `<div class="top col-sm-6" >
              <label class="col-xs-3 control-label">{{item.label}}</label>
              <div class="">
                <input type="text" class="inputCss col-xs-6" v-bind:name="item.field" :value="item.value" v-bind:placeholder="item.placeholder" />
              </div>
            </div>
          `,
    methods: {}
});
Vue.component('search-select', {
    props: ['item'],
    template: `<div class="top col-sm-6">
                  <label class="col-xs-3 control-label">{{item.label}}</label>
                  <div class="selectsDiv ">
                    <select class="selectInit" v-bind:name="item.field" v-bind:placeholder="item.placeholder" >
                      <option value="">请选择</option>
                      <option v-for="childItem in item.value" v-bind:value="childItem.key">{{childItem.val}}</option>
                    </select>
                  </div>
                </div>`
});
Vue.component('search-date', {
    props: ['item'],
    template: `<div class=" form-group">
                  <label class="col-xs-3 control-label">{{item.label}}</label>
                  <div class="input-group col-xs-4">
                    <input type="date" class="form-control" v-bind:name="item.field" v-bind:placeholder="item.placeholder" />
                  </div>
                </div>`
});
Vue.component('search-scope', {
    props: ['item'],
    template: `<div class="top col-sm-6">
                  <label class="col-xs-3 control-label ptop">{{item.label}}</label>
                  <div class="input-group ">
                    <input type="text" class="inputCss " v-bind:name="item.field + '1'" v-bind:placeholder="item.placeholder" /><input type="text" class="inputCss " v-bind:name="item.field + '2'" v-bind:placeholder="item.placeholder" />
                  </div>
                </div> `
});

Vue.component('search-selectMul', {
    props: ['item'],
    template: `<div class="top col-sm-6">
                  <label class="col-xs-3 control-label">{{item.label}}</label>
                  <div class="selectsDiv ">
                    <select class="selectInit" v-bind:name="item.field" v-bind:placeholder="item.placeholder" multiple="multiple">
                      <option v-for="childItem in item.value" v-bind:value="childItem.key">{{childItem.val}}</option>
                    </select>
                  </div>
                </div>
          `
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
            let temp = [], valArr = item.value.split(",");
            for (let index in valArr) {
                if (valArr[index]) {
                    if (item.field &&item.field == "neid") {
                        $.reportGtstar.dataFilterList.forEach(function (obj, i) {
                                 if (valArr[index] == obj.id) {
                                     temp.push({key: valArr[index], val: obj.neName})
                                 }
                             })
                    } else{
                        temp.push({key: valArr[index], val: valArr[index]})
                    }
                }
            }

            filters[index]['value'] = temp;
        }
    });
    // console.log(filters)
    return filters;
}

if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    }
}





