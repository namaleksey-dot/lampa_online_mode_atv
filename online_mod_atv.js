
/* Tests the Lampa request transport using synthetic, non-account data. */
(function () {
    'use strict';
    var component = 'atv_cookie_transport_test';
    var busy = false;
    function init() {
        if (Lampa.SettingsApi.getComponent(component)) return;
        Lampa.SettingsApi.addComponent({component: component, name: 'Apple TV — тест Cookie', icon: '<svg><use xlink:href="#sprite-settings"></use></svg>'});
        Lampa.SettingsApi.addParam({
            component: component,
            param: {name: 'atv_test_cookie_run', type: 'button'},
            field: {name: 'Проверить передачу Cookie', description: 'Отправляет вымышленный cookie на httpbin.org. Cookies HDrezka не используются.'},
            onChange: function () {
                if (busy) return;
                busy = true;
                var network = new Lampa.Reguest();
                var marker = 'atv_probe_' + Date.now();
                network.timeout(20000);
                Lampa.Noty.show('Проверяем передачу тестовых заголовков…');
                function show(message) {
                    busy = false;
                    Lampa.Select.show({title: 'Результат теста Cookie', items: [{title: message}], onSelect: function () { Lampa.Controller.toggle('settings'); }, onBack: function () { Lampa.Controller.toggle('settings'); }});
                }
                network.native('https://httpbin.org/anything?atv_probe=' + Date.now(), function (result) {
                    try {
                        if (typeof result === 'string') result = JSON.parse(result);
                        if (result && result.body) result = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
                    } catch (e) { show('Ответ сервера не распознан. Возможности Cookie не определены.'); return; }
                    if (!result || !result.headers) { show('Нет отражённых заголовков. Возможности Cookie не определены.'); return; }
                    var headers = {};
                    Object.keys(result.headers).forEach(function (key) { headers[key.toLowerCase()] = result.headers[key]; });
                    var cookie = String(headers.cookie || '').indexOf('lampa_test=' + marker) !== -1;
                    var control = headers['x-lampa-probe'] === marker;
                    show(cookie ? 'COOKIE ДОШЁЛ. Этот способ умеет передавать Cookie.' : control ? 'COOKIE НЕ ДОШЁЛ. Контрольный заголовок дошёл — Cookie отфильтрован по пути.' : 'ОБА ЗАГОЛОВКА НЕ ДОШЛИ. Передача произвольных заголовков не подтверждена.');
                }, function (request, reason) {
                    show('Тест не выполнен. HTTP ' + (request && request.status || 0) + ', ' + String(reason || 'ошибка сети') + '. Возможности Cookie не определены.');
                }, false, {dataType: 'json', headers: {'Cookie': 'lampa_test=' + marker, 'X-Lampa-Probe': marker}, withCredentials: false});
            }
        });
    }
    if (window.appready) init();
    else Lampa.Listener.follow('app', function (event) { if (event.type === 'ready') init(); });
})();
