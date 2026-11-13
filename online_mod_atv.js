
(function () {
    'use strict';
    var component = 'atv_proxy_check';
    var running = false;
    function escape(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function init() {
        if (Lampa.SettingsApi.getComponent(component)) return;
        Lampa.SettingsApi.addComponent({component: component, name: 'Apple TV — проверка прокси', icon: '<svg><use xlink:href="#sprite-settings"></use></svg>'});
        Lampa.SettingsApi.addParam({
            component: component,
            param: {name: 'atv_proxy_check_run', type: 'button'},
            field: {name: 'Проверить оба прокси', description: 'Шесть запросов с тестовыми данными к httpbin.org. Результаты появятся списком.'},
            onChange: function () {
                if (running) return;
                running = true;
                var network = new Lampa.Reguest();
                var results = [];
                var tests = [];
                var stamp = String(Date.now());
                ['cors.nb557.workers.dev', 'cors.fx666.workers.dev'].forEach(function (host) {
                    ['enc2-empty', 'enc2-cookie', 'plain-cookie'].forEach(function (mode) {
                        tests.push({host: host, mode: mode});
                    });
                });
                function next() {
                    if (!tests.length) {
                        running = false;
                        Lampa.Select.show({title: 'Проверка прокси завершена', items: results, onSelect: function () { Lampa.Controller.toggle('settings'); }, onBack: function () { Lampa.Controller.toggle('settings'); }});
                        return;
                    }
                    var test = tests.shift();
                    var target = 'https://httpbin.org/anything?atv_check=' + stamp;
                    var params = test.mode === 'enc2-empty' ? '' : 'param/Cookie=' + encodeURIComponent('lampa_probe=' + stamp) + '/';
                    var url = 'https://' + test.host + '/';
                    url += test.mode === 'plain-cookie' ? params + target : 'enc2/' + encodeURIComponent(btoa(params + target)) + '/anything?jacred.test';
                    Lampa.Noty.show('Проверка ' + (7 - tests.length - 1) + '/6: ' + test.host + ' ' + test.mode);
                    function finish(message) {
                        results.push({title: escape(test.host + ' / ' + test.mode), subtitle: escape(message)});
                        next();
                    }
                    network.timeout(12000);
                    network.native(url, function (body) {
                        var data = body;
                        try { if (typeof data === 'string') data = JSON.parse(data); } catch (e) {}
                        if (data && data.headers) {
                            var cookie = '';
                            Object.keys(data.headers).forEach(function (key) { if (key.toLowerCase() === 'cookie') cookie = String(data.headers[key]); });
                            finish(cookie.indexOf('lampa_probe=' + stamp) !== -1 ? 'OK — тестовый Cookie дошёл' : 'OK — ответ httpbin, тестового Cookie нет');
                        } else finish('Ответ получен, но формат неожиданный: ' + String(typeof body === 'string' ? body : JSON.stringify(body)).replace(/\s+/g, ' ').slice(0, 240));
                    }, function (request, reason) {
                        finish('HTTP ' + (request && request.status || 0) + ' ' + String(reason || '') + ' | ' + String(request && request.responseText || 'Пустой ответ').replace(/\s+/g, ' ').slice(0, 240));
                    }, false, {dataType: 'text', withCredentials: false});
                }
                next();
            }
        });
    }
    if (window.appready) init();
    else Lampa.Listener.follow('app', function (event) { if (event.type === 'ready') init(); });
})();



