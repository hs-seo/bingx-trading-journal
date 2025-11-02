// ========== 설정 ==========
const PROXY_URL = 'https://sweet-poetry-7f5e.forbluegrayoeccd.workers.dev';
const DB_NAME = 'BingXTradesDB';
const DB_VERSION = 2; // 버전 업그레이드 (사용자 입력 필드 추가)
const STORE_NAME = 'trades';
const SETTINGS_KEY = 'bingx_trade_settings';

let db = null;

// 기본 설정
const DEFAULT_SETTINGS = {
    entryMethods: [
        { value: "브레이크아웃", isDefault: false },
        { value: "되돌림", isDefault: false },
        { value: "패턴", isDefault: false },
        { value: "지표", isDefault: false },
        { value: "기타", isDefault: false }
    ],
    emotions: [
        { value: "차분함", isDefault: false },
        { value: "자신감", isDefault: false },
        { value: "조급함", isDefault: false },
        { value: "두려움", isDefault: false },
        { value: "흥분", isDefault: false },
        { value: "불안", isDefault: false }
    ]
};

// ========== 설정 관리 함수 ==========
function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('설정 로드 실패:', e);
            return DEFAULT_SETTINGS;
        }
    }
    return DEFAULT_SETTINGS;
}

function saveSettingsToStorage(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function renderSettingsUI() {
    const settings = loadSettings();

    // 진입방식 옵션 렌더링 (테이블 형식)
    const entryMethodContainer = document.getElementById('entryMethodOptions');
    entryMethodContainer.innerHTML = '';
    settings.entryMethods.forEach((option, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" value="${option.value}" data-type="entryMethod" data-index="${index}">
            </td>
            <td style="text-align: center;">
                <input type="checkbox" ${option.isDefault ? 'checked' : ''} data-type="entryMethod" data-index="${index}">
            </td>
            <td style="text-align: center;">
                <button class="delete-btn" onclick="deleteOption('entryMethod', ${index})">삭제</button>
            </td>
        `;
        entryMethodContainer.appendChild(row);
    });

    // 감정상태 옵션 렌더링 (테이블 형식)
    const emotionContainer = document.getElementById('emotionOptions');
    emotionContainer.innerHTML = '';
    settings.emotions.forEach((option, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" value="${option.value}" data-type="emotion" data-index="${index}">
            </td>
            <td style="text-align: center;">
                <input type="checkbox" ${option.isDefault ? 'checked' : ''} data-type="emotion" data-index="${index}">
            </td>
            <td style="text-align: center;">
                <button class="delete-btn" onclick="deleteOption('emotion', ${index})">삭제</button>
            </td>
        `;
        emotionContainer.appendChild(row);
    });
}

function addOption(type) {
    const newValue = prompt(`새로운 ${type === 'entryMethod' ? '진입방식' : '감정상태'}을 입력하세요:`);
    if (!newValue) return;

    const settings = loadSettings();
    const key = type === 'entryMethod' ? 'entryMethods' : 'emotions';

    settings[key].push({
        value: newValue,
        isDefault: false
    });

    saveSettingsToStorage(settings);
    renderSettingsUI();
    showStatus('✅ 옵션이 추가되었습니다', 'success');
}

function deleteOption(type, index) {
    if (!confirm('이 옵션을 삭제하시겠습니까?')) return;

    const settings = loadSettings();
    const key = type === 'entryMethod' ? 'entryMethods' : 'emotions';

    settings[key].splice(index, 1);

    saveSettingsToStorage(settings);
    renderSettingsUI();
    showStatus('✅ 옵션이 삭제되었습니다', 'success');
}

function saveSettings() {
    const settings = loadSettings();

    // 진입방식 옵션 수집
    const entryMethodInputs = document.querySelectorAll('#entryMethodOptions input[type="text"]');
    const entryMethodCheckboxes = document.querySelectorAll('#entryMethodOptions input[type="checkbox"]');
    settings.entryMethods = [];
    entryMethodInputs.forEach((input, index) => {
        settings.entryMethods.push({
            value: input.value,
            isDefault: entryMethodCheckboxes[index].checked
        });
    });

    // 감정상태 옵션 수집
    const emotionInputs = document.querySelectorAll('#emotionOptions input[type="text"]');
    const emotionCheckboxes = document.querySelectorAll('#emotionOptions input[type="checkbox"]');
    settings.emotions = [];
    emotionInputs.forEach((input, index) => {
        settings.emotions.push({
            value: input.value,
            isDefault: emotionCheckboxes[index].checked
        });
    });

    saveSettingsToStorage(settings);
    updateEditModalOptions();
    showStatus('✅ 설정이 저장되었습니다', 'success');
}

function resetSettings() {
    if (!confirm('설정을 기본값으로 초기화하시겠습니까?')) return;

    saveSettingsToStorage(DEFAULT_SETTINGS);
    renderSettingsUI();
    updateEditModalOptions();
    showStatus('✅ 설정이 초기화되었습니다', 'success');
}

function updateEditModalOptions() {
    const settings = loadSettings();

    // 진입방식 select 업데이트
    const entryMethodSelect = document.getElementById('editEntryMethod');
    entryMethodSelect.innerHTML = '<option value="">선택하세요</option>';
    settings.entryMethods.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.value;
        if (option.isDefault) {
            opt.selected = true;
        }
        entryMethodSelect.appendChild(opt);
    });

    // 감정상태 select 업데이트
    const emotionSelect = document.getElementById('editEmotion');
    emotionSelect.innerHTML = '<option value="">선택하세요</option>';
    settings.emotions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.value;
        if (option.isDefault) {
            opt.selected = true;
        }
        emotionSelect.appendChild(opt);
    });
}

// ========== 초기화 ==========
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    loadSavedKeys();
    await loadAndDisplayTrades();
    updateEditModalOptions(); // 설정 기반으로 모달 옵션 초기화
    renderSettingsUI(); // 설정 UI 초기 렌더링

    // 이벤트 위임으로 모든 버튼 처리
    document.body.addEventListener('click', (e) => {
        const target = e.target;

        // 편집 버튼 클릭
        if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
            e.preventDefault();
            const btn = target.classList.contains('edit-btn') ? target : target.closest('.edit-btn');
            const positionId = btn.dataset.positionId;
            console.log('편집 버튼 클릭됨, positionId:', positionId);
            if (positionId) {
                openEditModal(positionId);
            }
            return;
        }

        // 모달 닫기
        if (target.dataset.action === 'closeModal') {
            e.preventDefault();
            closeEditModal();
            return;
        }

        // 모달 저장
        if (target.dataset.action === 'saveModal') {
            e.preventDefault();
            saveTradeEdit();
            return;
        }

        // 모달 배경 클릭시 닫기
        if (target.classList.contains('modal')) {
            closeEditModal();
            return;
        }
    });
});

// ========== IndexedDB 초기화 ==========
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const oldVersion = event.oldVersion;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'orderId' });
                objectStore.createIndex('symbol', 'symbol', { unique: false });
                objectStore.createIndex('time', 'time', { unique: false });
            }

            // 버전 2 업그레이드: 사용자 입력 필드는 기존 레코드에 동적으로 추가됨
            // IndexedDB는 스키마리스이므로 별도 마이그레이션 불필요
        };
    });
}

// ========== API 키 관리 ==========
function loadSavedKeys() {
    try {
        const encryptedApiKey = localStorage.getItem('bingx_api_key');
        const encryptedSecretKey = localStorage.getItem('bingx_secret_key');

        if (encryptedApiKey && encryptedSecretKey) {
            // 간단한 복호화 (Base64)
            document.getElementById('apiKey').value = atob(encryptedApiKey);
            document.getElementById('secretKey').value = atob(encryptedSecretKey);
            showStatus('✅ 저장된 API 키를 불러왔습니다', 'success');
        }
    } catch (error) {
        console.error('Failed to load saved keys:', error);
    }
}

function saveKeys() {
    const saveKeysCheckbox = document.getElementById('saveKeys');
    if (!saveKeysCheckbox.checked) return;

    const apiKey = document.getElementById('apiKey').value.trim();
    const secretKey = document.getElementById('secretKey').value.trim();

    if (apiKey && secretKey) {
        // 간단한 암호화 (Base64) - 실제로는 더 강력한 암호화 필요
        localStorage.setItem('bingx_api_key', btoa(apiKey));
        localStorage.setItem('bingx_secret_key', btoa(secretKey));
    }
}

// ========== UI 유틸리티 ==========
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type} show`;

    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 5000);
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('show', show);
}

function switchTab(tabName, clickedElement) {
    // 탭 버튼 활성화
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // clickedElement가 제공되면 사용, 아니면 탭 이름으로 찾기
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        // 프로그래밍 방식으로 호출될 때
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            if (tab.textContent.includes(tabName === 'activity' ? 'Recent Activity' :
                                          tabName === 'trades' ? '전체 거래' :
                                          tabName === 'pinescript' ? 'Pine Script' : '')) {
                tab.classList.add('active');
            }
        });
    }

    // 탭 컨텐츠 표시
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');

    // Pine Script 복사 버튼 표시/숨김
    const copyBtn = document.getElementById('copyPineScriptBtn');
    if (copyBtn) {
        if (tabName === 'pinescript') {
            copyBtn.classList.add('show');
        } else {
            copyBtn.classList.remove('show');
        }
    }

    // Pine Script 탭 클릭 시 자동 생성
    if (tabName === 'pinescript') {
        generatePineScript();
    }

    // RR 계산기 탭 클릭 시 초기화
    if (tabName === 'rrcalc') {
        const tbody = document.getElementById('rrEntriesBody');
        if (tbody && tbody.children.length === 0) {
            addEntryRow();
        }
    }
}

// ========== BingX API 호출 ==========
function generateSignature(queryString, secretKey) {
    return CryptoJS.HmacSHA256(queryString, secretKey).toString();
}

async function makeApiRequest(endpoint, params = {}) {
    const apiKey = document.getElementById('apiKey').value.trim();
    const secretKey = document.getElementById('secretKey').value.trim();

    if (!apiKey || !secretKey) {
        showStatus('⚠️ API Key와 Secret Key를 입력해주세요', 'error');
        throw new Error('API keys required');
    }

    // 타임스탬프 추가
    params.timestamp = Date.now();

    // 쿼리스트링 생성 (알파벳 순서로 정렬)
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

    // 서명 생성
    const signature = generateSignature(sortedParams, secretKey);

    // Cloudflare Worker를 통해 요청
    const proxyUrl = `${PROXY_URL}?path=${encodeURIComponent(endpoint)}&query=${encodeURIComponent(sortedParams)}`;

    const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
            'X-BX-APIKEY': apiKey,
            'X-BX-SIGNATURE': signature
        }
    });

    const data = await response.json();

    if (data.code !== 0) {
        // Rate limit 감지 (code: 100410)
        if (data.code === 100410) {
            const error = new Error(data.msg || 'API 요청 빈도 제한 초과');
            error.isRateLimit = true;
            error.code = data.code;
            throw error;
        }
        throw new Error(data.msg || 'API 요청 실패');
    }

    return data.data;
}

// ========== 거래 내역 수집 ==========
async function fetchAllTrades(forceRefresh = false) {
    showLoading(true);
    saveKeys();

    try {
        if (forceRefresh) {
            await clearAllData(false);
        }

        // 1. 먼저 포지션 내역 가져오기
        showStatus('🔄 포지션 내역을 가져오는 중...', 'info');
        const positions = await fetchPositionHistory();

        // 2. 각 포지션에 대한 거래 내역 저장
        let newTradesCount = 0;
        for (const position of positions) {
            const saved = await saveTradeToIndexedDB(position);
            if (saved) newTradesCount++;
        }

        showStatus(`✅ ${newTradesCount}개의 새로운 거래를 저장했습니다`, 'success');
        await loadAndDisplayTrades();

    } catch (error) {
        showStatus(`❌ 오류: ${error.message}`, 'error');
        console.error('Error fetching trades:', error);
    } finally {
        showLoading(false);
    }
}

async function fetchPositionHistory() {
    const allPositions = [];

    try {
        console.log('📡 BingX API 호출 중... (병렬 처리)');

        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        // 사용자가 선택한 기간 가져오기
        const selectedPeriod = parseInt(document.getElementById('datePeriod')?.value || 30);
        const totalDays = selectedPeriod;
        const numRequests = Math.ceil(totalDays / 7);

        console.log(`최근 ${totalDays}일 데이터를 병렬로 가져옵니다...`);

        // 1. Perpetual Futures 조회 (병렬 처리)
        console.log('\n📊 Perpetual Futures (USDT-M) 조회 중...');
        const perpetualPromises = [];

        for (let i = 0; i < numRequests; i++) {
            const endTime = now - (i * sevenDays);
            const startTime = endTime - sevenDays;

            const params = {
                limit: 500,
                startTime: startTime,
                endTime: endTime
            };

            perpetualPromises.push(
                makeApiRequest('/openApi/swap/v2/trade/allOrders', params)
                    .then(data => {
                        if (data.orders && data.orders.length > 0) {
                            console.log(`   ✅ 기간 ${i + 1}: ${data.orders.length}개 주문`);
                            return data.orders.map(order => ({
                                ...order,
                                _source: 'Perpetual Futures (USDT-M)'
                            }));
                        }
                        return [];
                    })
                    .catch(error => {
                        if (error.isRateLimit) {
                            console.error(`   ⚠️ Rate Limit: ${error.message}`);
                            return { _rateLimitError: true, error };
                        }
                        console.error(`   ❌ 기간 ${i + 1} 실패:`, error.message);
                        return [];
                    })
            );
        }

        // 2. Standard Futures 조회 (병렬 처리)
        const standardSymbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'BNB-USDT', 'XRP-USDT'];

        console.log('\n📊 Standard Futures 조회 중...');
        const standardPromises = [];

        for (const symbol of standardSymbols) {
            for (let i = 0; i < numRequests; i++) {
                const endTime = now - (i * sevenDays);
                const startTime = endTime - sevenDays;

                const params = {
                    symbol: symbol,
                    limit: 500,
                    startTime: startTime,
                    endTime: endTime
                };

                standardPromises.push(
                    makeApiRequest('/openApi/contract/v1/allOrders', params)
                        .then(data => {
                            if (Array.isArray(data) && data.length > 0) {
                                console.log(`   ✅ ${symbol} 기간 ${i + 1}: ${data.length}개 주문`);

                                // Standard Futures 데이터 정규화
                                const normalizedOrders = data.map(order => {
                                    // 손익 계산
                                    let calculatedProfit = 0;
                                    if (order.closePrice && order.avgPrice && order.executedQty) {
                                        const priceDiff = order.closePrice - order.avgPrice;
                                        const qty = parseFloat(order.executedQty) || 0;

                                        if (order.positionSide === 'LONG') {
                                            calculatedProfit = priceDiff * qty;
                                        } else if (order.positionSide === 'SHORT') {
                                            calculatedProfit = -priceDiff * qty;
                                        }
                                    }

                                    return {
                                        ...order,
                                        positionID: order.positionId,
                                        price: order.avgPrice || order.closePrice || 0,
                                        profit: calculatedProfit,
                                        side: null,
                                        type: 'UNKNOWN',
                                        commission: 0,
                                        _source: 'Standard Futures',
                                        _originalData: order
                                    };
                                });

                                return normalizedOrders;
                            }
                            return [];
                        })
                        .catch(error => {
                            if (error.isRateLimit) {
                                console.error(`   ⚠️ Rate Limit: ${error.message}`);
                                return { _rateLimitError: true, error };
                            }
                            console.error(`   ❌ ${symbol} 기간 ${i + 1} 실패:`, error.message);
                            return [];
                        })
                );
            }
        }

        // 배치 단위로 병렬 실행 (rate limit 회피)
        const allPromises = [...perpetualPromises, ...standardPromises];

        // 기간에 따른 배치 설정 (BingX API: 2000 requests/10s for account endpoints)
        // 빠른 모드: ≤30일 (일반적인 사용)
        // 느린 모드: >30일 (전체 내역 가져오기)
        let BATCH_SIZE, BATCH_DELAY, MODE_NAME;
        if (totalDays <= 30) {
            BATCH_SIZE = 20;      // 한 번에 20개씩 병렬 실행
            BATCH_DELAY = 500;    // 배치 간 0.5초 대기
            MODE_NAME = '빠른 모드';
        } else {
            BATCH_SIZE = 5;       // 한 번에 5개씩만 병렬 실행
            BATCH_DELAY = 2000;   // 배치 간 2초 대기
            MODE_NAME = '안전 모드';
        }

        console.log(`\n⏳ ${MODE_NAME}: ${allPromises.length}개 요청을 ${Math.ceil(allPromises.length / BATCH_SIZE)}개 배치로 실행 중...`);

        const results = [];
        let rateLimitDetected = false;

        for (let i = 0; i < allPromises.length; i += BATCH_SIZE) {
            const batch = allPromises.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(allPromises.length / BATCH_SIZE);

            console.log(`   배치 ${batchNum}/${totalBatches}: ${batch.length}개 요청 실행 중...`);
            const batchResults = await Promise.all(batch);
            results.push(...batchResults);

            // Rate limit 감지
            const hasRateLimit = batchResults.some(result => result && result._rateLimitError);
            if (hasRateLimit && !rateLimitDetected) {
                rateLimitDetected = true;
                const rateLimitError = batchResults.find(r => r && r._rateLimitError);
                console.error('\n🚫 BingX API 요청 빈도 제한 감지!');
                showStatus('⚠️ BingX API 요청 제한이 감지되었습니다. 잠시 후 다시 시도해주세요. (10-20분 후 재시도 권장)', 'error');
                // 제한 감지 시 중단
                break;
            }

            // 마지막 배치가 아니면 대기
            if (i + BATCH_SIZE < allPromises.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
        }

        // 결과 통합 (rate limit 에러는 제외)
        results.forEach(orders => {
            if (Array.isArray(orders)) {
                allPositions.push(...orders);
            }
        });

        console.log(`\n총 ${allPositions.length}개 주문 가져옴`);

        // 심볼별 집계
        if (allPositions.length > 0) {
            const symbolCounts = {};
            allPositions.forEach(order => {
                symbolCounts[order.symbol] = (symbolCounts[order.symbol] || 0) + 1;
            });
            console.log('심볼별 주문 수:', symbolCounts);
        }

        // 중복 제거 (orderId 기준)
        const uniqueOrders = Array.from(
            new Map(allPositions.map(order => [order.orderId, order])).values()
        );

        console.log(`중복 제거 후: ${uniqueOrders.length}개`);

        return uniqueOrders;

    } catch (error) {
        console.error('Error fetching position history:', error);
        return allPositions;
    }
}

// ========== IndexedDB 저장 ==========
function saveTradeToIndexedDB(trade) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // 디버깅: 첫 3개 거래 데이터 구조 확인
        if (!window.tradeLogCount) window.tradeLogCount = 0;
        if (window.tradeLogCount < 3) {
            console.log(`=== ${window.tradeLogCount + 1}번째 거래 데이터 ===`);
            console.log('전체 데이터:', trade);
            console.log('symbol:', trade.symbol);
            console.log('side:', trade.side, 'positionSide:', trade.positionSide);
            console.log('time:', trade.time, new Date(trade.time));
            console.log('updateTime:', trade.updateTime, trade.updateTime ? new Date(trade.updateTime) : 'N/A');
            console.log('status:', trade.status);
            console.log('type:', trade.type);
            console.log('profit:', trade.profit);
            console.log('rawData keys:', Object.keys(trade));
            window.tradeLogCount++;
        }

        // orderId를 고유 키로 사용
        const tradeData = {
            orderId: trade.orderId,
            symbol: trade.symbol,
            side: trade.side,
            positionSide: trade.positionSide,
            price: parseFloat(trade.price),
            executedQty: parseFloat(trade.executedQty),
            profit: parseFloat(trade.profit || 0),
            commission: parseFloat(trade.commission || 0),
            time: trade.time,
            updateTime: trade.updateTime,
            status: trade.status,
            type: trade.type,
            positionID: trade.positionID, // 포지션 ID 추가
            _source: trade._source || 'Unknown', // 출처 정보 저장
            rawData: trade,
            // 사용자 입력 필드 (기본값)
            entryMethod: trade.entryMethod || '',
            emotion: trade.emotion || '',
            ruleCompliance: trade.ruleCompliance !== undefined ? trade.ruleCompliance : null,
            memo: trade.memo || ''
        };

        const request = store.add(tradeData);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => {
            if (e.target.error.name === 'ConstraintError') {
                // 이미 존재하는 거래
                resolve(false);
            } else {
                reject(e.target.error);
            }
        };
    });
}

function getAllTradesFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 거래 정보 업데이트 (사용자 입력 저장)
async function updateTradeInIndexedDB(orderId, updates) {
    return new Promise(async (resolve, reject) => {
        try {
            // 먼저 모든 거래를 가져와서 정확한 orderId 찾기
            const trades = await getAllTradesFromIndexedDB();
            const trade = trades.find(t => t.orderId == orderId || t.orderId === orderId || t.orderId.toString() === orderId);

            if (!trade) {
                console.error('거래를 찾을 수 없음. 찾으려는 ID:', orderId, 'type:', typeof orderId);
                console.error('저장된 ID들:', trades.map(t => ({id: t.orderId, type: typeof t.orderId})));
                reject(new Error('Trade not found'));
                return;
            }

            // 실제 저장된 orderId 사용
            const actualOrderId = trade.orderId;
            console.log('실제 orderId:', actualOrderId, 'type:', typeof actualOrderId);

            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(actualOrderId);

            getRequest.onsuccess = () => {
                const tradeToUpdate = getRequest.result;
                if (tradeToUpdate) {
                    // 업데이트할 필드만 병합
                    Object.assign(tradeToUpdate, updates);
                    const putRequest = store.put(tradeToUpdate);
                    putRequest.onsuccess = () => resolve(true);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Trade not found in store'));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        } catch (error) {
            reject(error);
        }
    });
}

// ========== 포지션별 보유시간 계산 ==========
function calculatePositionHoldingTime(trade, allTrades) {
    if (!trade.positionID) return null;

    // 같은 positionID를 가진 모든 주문 찾기
    const positionTrades = allTrades.filter(t => t.positionID === trade.positionID);

    if (positionTrades.length === 0) return null;

    // 시간순 정렬
    positionTrades.sort((a, b) => a.time - b.time);

    // 첫 주문(진입)과 마지막 주문(청산) 시간
    const firstTrade = positionTrades[0];
    const lastTrade = positionTrades[positionTrades.length - 1];

    const entryTime = firstTrade.time;
    const exitTime = lastTrade.updateTime || lastTrade.time;

    const diffMs = exitTime - entryTime;

    if (diffMs <= 0) return null;

    return {
        milliseconds: diffMs,
        hours: Math.floor(diffMs / (1000 * 60 * 60)),
        minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
        formatted: `${Math.floor(diffMs / (1000 * 60 * 60))}시간 ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}분`
    };
}

// ========== 포지션 그룹화 함수 ==========
function groupOrdersByPosition(orders) {
    const positionMap = new Map();

    orders.forEach(order => {
        const posId = order.positionID;
        if (!posId) return; // positionID 없는 주문 제외

        if (!positionMap.has(posId)) {
            positionMap.set(posId, {
                positionID: posId,
                symbol: order.symbol,
                positionSide: order.positionSide,
                orders: [],
                _source: order._source || 'Unknown'
            });
        }

        positionMap.get(posId).orders.push(order);
    });

    // 각 포지션의 집계 정보 계산
    const positions = Array.from(positionMap.values()).map(position => {
        const orders = position.orders;

        // 시간순 정렬
        orders.sort((a, b) => a.time - b.time);

        const firstOrder = orders[0];
        const lastOrder = orders[orders.length - 1];

        // 총 손익 계산
        const totalProfit = orders.reduce((sum, o) => sum + (parseFloat(o.profit) || 0), 0);

        // 총 수량 계산
        const totalQty = orders.reduce((sum, o) => sum + (parseFloat(o.executedQty) || 0), 0);

        // 평균 가격 계산 (가중 평균)
        let totalValue = 0;
        let totalQuantity = 0;
        orders.forEach(o => {
            const price = parseFloat(o.price) || parseFloat(o.avgPrice) || 0;
            const qty = parseFloat(o.executedQty) || 0;
            totalValue += price * qty;
            totalQuantity += qty;
        });
        const avgPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;

        // 보유 시간 계산
        const holdingTimeMs = lastOrder.updateTime - firstOrder.time;
        const holdingHours = Math.floor(holdingTimeMs / (1000 * 60 * 60));
        const holdingMinutes = Math.floor((holdingTimeMs % (1000 * 60 * 60)) / (1000 * 60));

        // 포지션 상태 판단
        let isClosed = false;

        // Standard Futures vs Perpetual Futures로 구분
        const isStandardFutures = position._source === 'Standard Futures';

        if (isStandardFutures) {
            // Standard Futures: status 필드로 직접 확인
            // Standard Futures API는 포지션별로 status: CLOSED를 제공함
            const allOrdersClosed = orders.every(o => o.status === 'CLOSED' || o.state === 'CLOSED');
            isClosed = allOrdersClosed;

        } else {
            // Perpetual Futures: 기존 로직 사용
            // 1. closePosition 필드로 확인
            const hasCloseOrder = orders.some(o => o.closePosition === true || o.closePosition === 'true');

            // 2. side/positionSide로 판단
            // LONG: SELL이 청산, SHORT: BUY가 청산
            let totalBuyQty = 0;
            let totalSellQty = 0;

            orders.forEach(o => {
                const qty = parseFloat(o.executedQty) || 0;
                if (o.side === 'BUY') {
                    totalBuyQty += qty;
                } else if (o.side === 'SELL') {
                    totalSellQty += qty;
                }
            });

            // LONG 포지션: SELL 수량이 BUY 수량 이상이면 청산
            // SHORT 포지션: BUY 수량이 SELL 수량 이상이면 청산
            const isFullyClosed = position.positionSide === 'LONG'
                ? totalSellQty >= totalBuyQty * 0.99  // 0.99는 소수점 오차 허용
                : totalBuyQty >= totalSellQty * 0.99;

            isClosed = hasCloseOrder || isFullyClosed;
        }

        // 사용자 입력 데이터 (첫 번째 주문에서 가져오기, 나중에 포지션별로 저장)
        const userData = {
            entryMethod: firstOrder.entryMethod || '',
            emotion: firstOrder.emotion || '',
            ruleCompliance: firstOrder.ruleCompliance,
            memo: firstOrder.memo || ''
        };

        return {
            ...position,
            entryTime: firstOrder.time,
            exitTime: isClosed ? lastOrder.updateTime : null,
            avgPrice: avgPrice,
            totalQty: totalQty,
            totalProfit: totalProfit,
            holdingTime: `${holdingHours}h ${holdingMinutes}m`,
            holdingTimeMs: holdingTimeMs,
            isClosed: isClosed,
            orderCount: orders.length,
            ...userData
        };
    });

    return positions;
}

// ========== 거래 내역 표시 ==========
async function loadAndDisplayTrades() {
    try {
        const orders = await getAllTradesFromIndexedDB();

        if (orders.length === 0) {
            document.getElementById('tradesContainer').innerHTML =
                '<p style="text-align:center; color:#999; padding:40px;">아직 거래 내역이 없습니다.<br>위의 "거래 가져오기" 버튼을 클릭하세요.</p>';
            document.getElementById('activityContainer').innerHTML =
                '<p style="text-align:center; color:#999; padding:40px;">아직 거래 내역이 없습니다.<br>위의 "거래 가져오기" 버튼을 클릭하세요.</p>';
            return;
        }

        // 포지션 단위로 그룹화
        const positions = groupOrdersByPosition(orders);

        // 시간순 정렬 (최신순)
        positions.sort((a, b) => b.entryTime - a.entryTime);

        console.log('📊 포지션 그룹화 완료:', {
            총주문수: orders.length,
            포지션수: positions.length,
            샘플포지션: positions[0]
        });

        // 포지션 단위 거래 내역 표시
        displayTrades(positions);

        // Recent Activity 표시
        displayRecentActivity(positions);

        // 통계 계산 및 표시
        displayStats(positions);

    } catch (error) {
        console.error('Error loading trades:', error);
    }
}

function displayRecentActivity(positions) {
    const container = document.getElementById('activityContainer');

    // 날짜별로 그룹화 (진입 시간 기준)
    const positionsByDate = {};
    positions.forEach(position => {
        const date = new Date(position.entryTime);
        const dateKey = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });

        if (!positionsByDate[dateKey]) {
            positionsByDate[dateKey] = [];
        }
        positionsByDate[dateKey].push(position);
    });

    let html = '';

    // 날짜별로 표시
    Object.keys(positionsByDate).forEach(dateKey => {
        const dayPositions = positionsByDate[dateKey];

        // 일일 통계 계산
        const closedPositions = dayPositions.filter(p => p.isClosed);
        const wins = closedPositions.filter(p => p.totalProfit > 0).length;
        const losses = closedPositions.filter(p => p.totalProfit < 0).length;
        const totalPnL = closedPositions.reduce((sum, p) => sum + (parseFloat(p.totalProfit) || 0), 0);
        const pnlSign = totalPnL >= 0 ? '+' : '';

        // 규칙준수율
        const positionsWithRuleData = dayPositions.filter(p => p.ruleCompliance !== null && p.ruleCompliance !== undefined);
        const ruleCompliantPositions = positionsWithRuleData.filter(p => p.ruleCompliance === true);
        const ruleComplianceRate = positionsWithRuleData.length > 0
            ? `${((ruleCompliantPositions.length / positionsWithRuleData.length) * 100).toFixed(0)}%`
            : 'N/A';

        html += `
            <div class="date-section">
                <div class="date-header">
                    <div class="date-title">${dateKey}</div>
                    <div class="date-summary">
                        포지션: ${dayPositions.length} | 승/패: ${wins}/${losses} |
                        손익: <span style="color:white; font-weight:700;">${pnlSign}${parseFloat(totalPnL.toFixed(2))} USDT</span> |
                        규칙준수: ${ruleComplianceRate}
                    </div>
                </div>
        `;

        // 해당 날짜의 포지션들 표시
        dayPositions.forEach(position => {
            const side = position.positionSide === 'LONG' ? 'long' : 'short';
            const time = new Date(position.entryTime).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const profit = position.totalProfit || 0;
            const profitSign = profit >= 0 ? '+' : '';

            // 손익(%) 계산
            const positionValue = position.avgPrice * position.totalQty;
            const profitPercent = positionValue > 0 ? parseFloat(((profit / positionValue) * 100).toFixed(2)) : 0;

            const hasUserInput = position.entryMethod || position.emotion || position.ruleCompliance !== null || position.memo;
            const editIcon = hasUserInput ? '✏️' : '➕';

            const statusBadge = position.isClosed
                ? '<span style="background:#4caf50; padding:2px 6px; border-radius:4px; font-size:10px;">청산</span>'
                : '<span style="background:#ff9800; padding:2px 6px; border-radius:4px; font-size:10px;">진행중</span>';

            // 수량과 손익 포맷 (불필요한 0 제거)
            const formattedQty = parseFloat(position.totalQty.toFixed(4));
            const formattedProfit = parseFloat(profit.toFixed(2));

            html += `
                <div class="trade-item ${side}" data-position-id="${position.positionID}">
                    <div class="trade-header">
                        <span class="symbol">${position.symbol}</span>
                        <div>
                            <span class="side ${side}">${position.positionSide}</span>
                            ${statusBadge}
                            <button class="edit-btn" data-position-id="${position.positionID}">${editIcon}</button>
                        </div>
                    </div>
                    <div class="trade-info">
                        🕐 ${time}<br>
                        💰 평균가: ${parseFloat(position.avgPrice.toFixed(2))} USDT<br>
                        📦 수량: ${formattedQty}<br>
                        📊 주문: ${position.orderCount}개<br>
                        💵 손익: <span style="color:${profit >= 0 ? '#4caf50' : '#f44336'}; font-weight:600;">${profitSign}${formattedProfit} USDT (${profitSign}${profitPercent}%)</span><br>
                        ⏱️ 보유: ${position.holdingTime}<br>
                        ${position.entryMethod ? `📍 ${position.entryMethod}<br>` : ''}
                        ${position.emotion ? `😊 ${position.emotion}<br>` : ''}
                        ${position.ruleCompliance !== null ? `✅ ${position.ruleCompliance ? '준수' : '미준수'}<br>` : ''}
                        ${position.memo ? `📝 ${position.memo}` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
    });

    container.innerHTML = html;
}

function displayTrades(positions) {
    const container = document.getElementById('tradesContainer');
    let html = '';

    positions.forEach(position => {
        const side = position.positionSide === 'LONG' ? 'long' : 'short';
        const entryTime = new Date(position.entryTime).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        const exitTime = position.exitTime ? new Date(position.exitTime).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '미청산';
        const profit = position.totalProfit || 0;
        const profitSign = profit >= 0 ? '+' : '';

        // 손익(%) 계산
        const positionValue = position.avgPrice * position.totalQty;
        const profitPercent = positionValue > 0 ? parseFloat(((profit / positionValue) * 100).toFixed(2)) : 0;

        // 사용자 입력 상태
        const hasUserInput = position.entryMethod || position.emotion || position.ruleCompliance !== null || position.memo;
        const editIcon = hasUserInput ? '✏️' : '➕';

        // 상태 표시
        const statusBadge = position.isClosed
            ? '<span style="background:#4caf50; padding:2px 6px; border-radius:4px; font-size:10px;">청산</span>'
            : '<span style="background:#ff9800; padding:2px 6px; border-radius:4px; font-size:10px;">진행중</span>';

        // 수량과 손익 포맷 (불필요한 0 제거)
        const formattedQty = parseFloat(position.totalQty.toFixed(4));
        const formattedProfit = parseFloat(profit.toFixed(2));
        const formattedAvgPrice = parseFloat(position.avgPrice.toFixed(2));

        html += `
            <div class="trade-item ${side}" data-position-id="${position.positionID}">
                <div class="trade-header">
                    <span class="symbol">${position.symbol}</span>
                    <div>
                        <span class="side ${side}">${position.positionSide}</span>
                        ${statusBadge}
                        <button class="edit-btn" data-position-id="${position.positionID}">${editIcon}</button>
                    </div>
                </div>
                <div class="trade-info">
                    📅 진입: ${entryTime}<br>
                    ${position.isClosed ? `🏁 청산: ${exitTime}<br>` : ''}
                    💰 평균가격: ${formattedAvgPrice} USDT<br>
                    📦 총수량: ${formattedQty}<br>
                    📊 주문수: ${position.orderCount}개 (<span class="detail-link" data-position-id="${position.positionID}" style="color:#2196f3; cursor:pointer; text-decoration:underline;">상세보기</span>)<br>
                    💵 손익: <span style="color:${profit >= 0 ? '#4caf50' : '#f44336'}; font-weight:600;">${profitSign}${formattedProfit} USDT (${profitSign}${profitPercent}%)</span><br>
                    ⏱️ 보유시간: ${position.holdingTime}<br>
                    ${position._source ? `🔗 ${position._source}<br>` : ''}
                    ${position.entryMethod ? `📍 진입방식: ${position.entryMethod}<br>` : ''}
                    ${position.emotion ? `😊 감정: ${position.emotion}<br>` : ''}
                    ${position.ruleCompliance !== null ? `✅규칙준수: ${position.ruleCompliance ? '준수' : '미준수'}<br>` : ''}
                    ${position.memo ? `📝 메모: ${position.memo}` : ''}
                </div>
                <div class="order-details" id="orders-${position.positionID}" style="display:none; margin-top:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:4px;">
                    <!-- 개별 주문 상세 정보 -->
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // 상세보기 이벤트 리스너 추가
    document.querySelectorAll('.detail-link').forEach(link => {
        link.addEventListener('click', function() {
            const positionId = this.getAttribute('data-position-id');
            toggleOrderDetails(positionId, positions);
        });
    });
}

// 개별 주문 상세 정보 토글
function toggleOrderDetails(positionId, positions) {
    const detailsDiv = document.getElementById(`orders-${positionId}`);
    const position = positions.find(p => p.positionID == positionId);

    if (!position) return;

    if (detailsDiv.style.display === 'none') {
        // 상세 정보 표시
        let html = '<div style="font-size:12px; color:#ddd;"><strong>개별 주문 상세:</strong></div>';
        html += '<table style="width:100%; font-size:11px; margin-top:8px; border-collapse:collapse;">';
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th>시간</th><th>가격</th><th>수량</th><th>손익</th></tr>';

        position.orders.forEach(order => {
            const time = new Date(order.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            const price = parseFloat(order.price) || parseFloat(order.avgPrice) || 0;
            const qty = parseFloat(order.executedQty) || 0;
            const profit = parseFloat(order.profit) || 0;
            const profitColor = profit >= 0 ? '#4caf50' : '#f44336';

            html += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:4px;">${time}</td>
                    <td style="padding:4px;">${parseFloat(price.toFixed(2))}</td>
                    <td style="padding:4px;">${parseFloat(qty.toFixed(4))}</td>
                    <td style="padding:4px; color:${profitColor};">${parseFloat(profit.toFixed(2))}</td>
                </tr>
            `;
        });

        html += '</table>';
        detailsDiv.innerHTML = html;
        detailsDiv.style.display = 'block';
    } else {
        // 상세 정보 숨기기
        detailsDiv.style.display = 'none';
    }
}

function displayStats(positions) {
    // 총 포지션 수
    const totalTrades = positions.length;

    // 청산된 포지션만 필터링
    const closedPositions = positions.filter(p => p.isClosed);

    // 승률 계산
    const winningPositions = closedPositions.filter(p => p.totalProfit > 0);
    const losingPositions = closedPositions.filter(p => p.totalProfit < 0);
    const winRate = closedPositions.length > 0
        ? ((winningPositions.length / closedPositions.length) * 100).toFixed(1)
        : 0;

    // 총 손익
    const totalPnL = closedPositions.reduce((sum, p) => sum + (parseFloat(p.totalProfit) || 0), 0);

    // 최대 승리/패배
    const maxWin = winningPositions.length > 0
        ? Math.max(...winningPositions.map(p => p.totalProfit))
        : 0;
    const maxLoss = losingPositions.length > 0
        ? Math.min(...losingPositions.map(p => p.totalProfit))
        : 0;

    // 규칙준수율
    const positionsWithRuleData = positions.filter(p => p.ruleCompliance !== null && p.ruleCompliance !== undefined);
    const ruleCompliantPositions = positionsWithRuleData.filter(p => p.ruleCompliance === true);
    const ruleComplianceRate = positionsWithRuleData.length > 0
        ? ((ruleCompliantPositions.length / positionsWithRuleData.length) * 100).toFixed(1)
        : 'N/A';

    // 평균 보유시간 (포지션 기반)
    let avgHoldingTime = 'N/A';
    if (positions.length > 0) {
        const totalMs = positions.reduce((sum, p) => sum + (p.holdingTimeMs || 0), 0);
        const avgMs = totalMs / positions.length;
        const avgHours = Math.floor(avgMs / (1000 * 60 * 60));
        const avgMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
        avgHoldingTime = `${avgHours}h ${avgMinutes}m`;
    }

    // 디버깅: 보유시간 데이터 확인
    console.log('=== 포지션 통계 디버깅 ===');
    console.log('전체 포지션 수:', positions.length);
    console.log('청산 포지션 수:', closedPositions.length);
    console.log('승리 포지션 수:', winningPositions.length);
    console.log('손실 포지션 수:', losingPositions.length);

    // 거래한 심볼 수
    const symbols = new Set(positions.map(p => p.symbol));
    const totalSymbols = symbols.size;

    // UI 업데이트
    document.getElementById('totalTrades').textContent = totalTrades;
    document.getElementById('winRate').textContent = winRate + '%';
    document.getElementById('totalPnL').textContent = (totalPnL >= 0 ? '+' : '') + parseFloat(totalPnL.toFixed(2));
    document.getElementById('totalSymbols').textContent = totalSymbols;
    document.getElementById('maxWin').textContent = '+' + parseFloat(maxWin.toFixed(2));
    document.getElementById('maxLoss').textContent = parseFloat(maxLoss.toFixed(2));
    document.getElementById('ruleComplianceRate').textContent = ruleComplianceRate === 'N/A' ? ruleComplianceRate : ruleComplianceRate + '%';
    document.getElementById('avgHoldingTime').textContent = avgHoldingTime;

    // 카드 색상 동적 변경
    // 승률 카드: 50% 이상이면 녹색, 아니면 빨간색
    const winRateCard = document.getElementById('winRateCard');
    const winRateNum = parseFloat(winRate);
    if (winRateNum >= 50) {
        winRateCard.className = 'stat-card green';
    } else if (winRateNum > 0) {
        winRateCard.className = 'stat-card red';
    } else {
        winRateCard.className = 'stat-card';
    }

    // 총 손익 카드: 0 이상이면 녹색, 아니면 빨간색
    const pnlCard = document.getElementById('pnlCard');
    if (totalPnL > 0) {
        pnlCard.className = 'stat-card green';
    } else if (totalPnL < 0) {
        pnlCard.className = 'stat-card red';
    } else {
        pnlCard.className = 'stat-card';
    }

    // 최대 승리 카드: 0보다 크면 녹색
    const maxWinCard = document.getElementById('maxWinCard');
    if (maxWin > 0) {
        maxWinCard.className = 'stat-card green';
    } else {
        maxWinCard.className = 'stat-card';
    }

    // 통계 섹션 표시
    document.getElementById('statsSection').style.display = 'block';
}

// ========== Pine Script 생성 (positionID 기반) ==========
async function generatePineScript() {
    showStatus('🔄 Pine Script 생성 중...', 'info');

    try {
        const trades = await getAllTradesFromIndexedDB();

        if (trades.length === 0) {
            showStatus('⚠️ 거래 내역이 없습니다', 'error');
            return;
        }

        // positionID별로 그룹화하여 포지션 생성
        const positionsMap = new Map();

        trades.forEach(trade => {
            if (!trade.positionID) return;

            if (!positionsMap.has(trade.positionID)) {
                positionsMap.set(trade.positionID, []);
            }
            positionsMap.get(trade.positionID).push(trade);
        });

        // 각 포지션의 진입/청산 시간 계산 (청산된 포지션만)
        const positions = [];
        positionsMap.forEach((positionTrades, positionID) => {
            // 시간순 정렬
            positionTrades.sort((a, b) => a.time - b.time);

            const firstTrade = positionTrades[0];
            const lastTrade = positionTrades[positionTrades.length - 1];

            // 포지션 청산 여부 확인
            const isStandardFutures = firstTrade._source === 'Standard Futures';
            let isClosed = false;

            if (isStandardFutures) {
                // Standard Futures: status 필드로 확인
                isClosed = positionTrades.every(t => t.status === 'CLOSED' || t.state === 'CLOSED');
            } else {
                // Perpetual Futures: closePosition 또는 수량 균형 확인
                const hasCloseOrder = positionTrades.some(t => t.closePosition === true || t.closePosition === 'true');

                let totalBuyQty = 0;
                let totalSellQty = 0;
                positionTrades.forEach(t => {
                    const qty = parseFloat(t.executedQty) || 0;
                    if (t.side === 'BUY') {
                        totalBuyQty += qty;
                    } else if (t.side === 'SELL') {
                        totalSellQty += qty;
                    }
                });

                const isFullyClosed = firstTrade.positionSide === 'LONG'
                    ? totalSellQty >= totalBuyQty * 0.99
                    : totalBuyQty >= totalSellQty * 0.99;

                isClosed = hasCloseOrder || isFullyClosed;
            }

            // 청산된 포지션만 Pine Script에 포함
            if (isClosed) {
                const symbol = firstTrade.symbol.replace('-USDT', '').replace('USDT', '');
                const side = firstTrade.positionSide; // LONG 또는 SHORT

                positions.push({
                    symbol: symbol,
                    side: side,
                    entryTime: firstTrade.time,
                    exitTime: lastTrade.updateTime || lastTrade.time
                });
            }
        });

        console.log('포지션 수:', positions.length);
        console.log('포지션 데이터:', positions);

        // 심볼별, 방향별로 그룹화
        const bySymbol = {};
        positions.forEach(pos => {
            if (!bySymbol[pos.symbol]) {
                bySymbol[pos.symbol] = { LONG: [], SHORT: [] };
            }
            bySymbol[pos.symbol][pos.side].push(pos);
        });

        // Pine Script 생성
        let pineScript = `//@version=5
indicator("거래 일지", overlay=true)

// 한국 시간을 UTC로 변환하는 함수 (9시간 빼기)
inTradeKST(simple int y1, simple int m1, simple int d1, simple int h1, simple int min1,
           simple int y2, simple int m2, simple int d2, simple int h2, simple int min2) =>
    entryTime = timestamp(y1, m1, d1, h1, min1) - 9 * 3600000
    exitTime = timestamp(y2, m2, d2, h2, min2) - 9 * 3600000
    time >= entryTime and time <= exitTime

// 특정 시간이 현재 캔들에 포함되는지 체크
isTimeInBar(simple int y, simple int m, simple int d, simple int h, simple int min) =>
    targetTime = timestamp(y, m, d, h, min) - 9 * 3600000
    time <= targetTime and time_close > targetTime

// 심볼 매칭 함수
isSymbol(string symbolName) =>
    str.contains(str.upper(syminfo.ticker), symbolName) or str.upper(syminfo.basecurrency) == symbolName

`;

        // 심볼별로 함수 생성
        const symbolList = Object.keys(bySymbol).sort();

        symbolList.forEach(symbol => {
            const symbolData = bySymbol[symbol];

            // Long 포지션
            if (symbolData.LONG && symbolData.LONG.length > 0) {
                pineScript += `// ============== ${symbol} Long ==============\n`;
                pineScript += `get${symbol}Long() =>\n    `;

                const longConditions = symbolData.LONG.map(pos => {
                    const entryDate = new Date(pos.entryTime);
                    const exitDate = new Date(pos.exitTime);
                    return `inTradeKST(${entryDate.getFullYear()}, ${entryDate.getMonth() + 1}, ${entryDate.getDate()}, ${entryDate.getHours()}, ${entryDate.getMinutes()}, ${exitDate.getFullYear()}, ${exitDate.getMonth() + 1}, ${exitDate.getDate()}, ${exitDate.getHours()}, ${exitDate.getMinutes()})`;
                });

                pineScript += longConditions.join(' or ') + '\n\n';

                // Open/Close 시점
                pineScript += `// ${symbol} Long Open/Close 시점\n`;
                pineScript += `get${symbol}LongOpenClose() =>\n    `;

                const longPoints = symbolData.LONG.flatMap(pos => {
                    const entryDate = new Date(pos.entryTime);
                    const exitDate = new Date(pos.exitTime);
                    return [
                        `isTimeInBar(${entryDate.getFullYear()}, ${entryDate.getMonth() + 1}, ${entryDate.getDate()}, ${entryDate.getHours()}, ${entryDate.getMinutes()})`,
                        `isTimeInBar(${exitDate.getFullYear()}, ${exitDate.getMonth() + 1}, ${exitDate.getDate()}, ${exitDate.getHours()}, ${exitDate.getMinutes()})`
                    ];
                });

                pineScript += longPoints.join(' or ') + '\n\n';
            }

            // Short 포지션
            if (symbolData.SHORT && symbolData.SHORT.length > 0) {
                pineScript += `// ============== ${symbol} Short ==============\n`;
                pineScript += `get${symbol}Short() =>\n    `;

                const shortConditions = symbolData.SHORT.map(pos => {
                    const entryDate = new Date(pos.entryTime);
                    const exitDate = new Date(pos.exitTime);
                    return `inTradeKST(${entryDate.getFullYear()}, ${entryDate.getMonth() + 1}, ${entryDate.getDate()}, ${entryDate.getHours()}, ${entryDate.getMinutes()}, ${exitDate.getFullYear()}, ${exitDate.getMonth() + 1}, ${exitDate.getDate()}, ${exitDate.getHours()}, ${exitDate.getMinutes()})`;
                });

                pineScript += shortConditions.join(' or ') + '\n\n';

                // Open/Close 시점
                pineScript += `// ${symbol} Short Open/Close 시점\n`;
                pineScript += `get${symbol}ShortOpenClose() =>\n    `;

                const shortPoints = symbolData.SHORT.flatMap(pos => {
                    const entryDate = new Date(pos.entryTime);
                    const exitDate = new Date(pos.exitTime);
                    return [
                        `isTimeInBar(${entryDate.getFullYear()}, ${entryDate.getMonth() + 1}, ${entryDate.getDate()}, ${entryDate.getHours()}, ${entryDate.getMinutes()})`,
                        `isTimeInBar(${exitDate.getFullYear()}, ${exitDate.getMonth() + 1}, ${exitDate.getDate()}, ${exitDate.getHours()}, ${exitDate.getMinutes()})`
                    ];
                });

                pineScript += shortPoints.join(' or ') + '\n\n';
            }
        });

        // 심볼별 포지션 설정
        pineScript += `// ============== 심볼별 포지션 ==============\n`;

        const symbolsWithLong = symbolList.filter(s => bySymbol[s].LONG?.length > 0);
        const symbolsWithShort = symbolList.filter(s => bySymbol[s].SHORT?.length > 0);

        if (symbolsWithLong.length > 0) {
            pineScript += 'longPos  = ';
            if (symbolsWithLong.length === 1) {
                pineScript += `isSymbol("${symbolsWithLong[0]}") ? get${symbolsWithLong[0]}Long() : false`;
            } else {
                pineScript += symbolsWithLong
                    .map((s, i) => i === 0 ? `isSymbol("${s}") ? get${s}Long()` : `(isSymbol("${s}") ? get${s}Long()`)
                    .join(' : ') + ' : false' + ')'.repeat(symbolsWithLong.length - 1);
            }
            pineScript += '\n';
        }

        if (symbolsWithShort.length > 0) {
            pineScript += 'shortPos = ';
            if (symbolsWithShort.length === 1) {
                pineScript += `isSymbol("${symbolsWithShort[0]}") ? get${symbolsWithShort[0]}Short() : false`;
            } else {
                pineScript += symbolsWithShort
                    .map((s, i) => i === 0 ? `isSymbol("${s}") ? get${s}Short()` : `(isSymbol("${s}") ? get${s}Short()`)
                    .join(' : ') + ' : false' + ')'.repeat(symbolsWithShort.length - 1);
            }
            pineScript += '\n';
        }

        if (symbolsWithLong.length > 0) {
            pineScript += 'longOpenClose  = ';
            if (symbolsWithLong.length === 1) {
                pineScript += `isSymbol("${symbolsWithLong[0]}") ? get${symbolsWithLong[0]}LongOpenClose() : false`;
            } else {
                pineScript += symbolsWithLong
                    .map((s, i) => i === 0 ? `isSymbol("${s}") ? get${s}LongOpenClose()` : `(isSymbol("${s}") ? get${s}LongOpenClose()`)
                    .join(' : ') + ' : false' + ')'.repeat(symbolsWithLong.length - 1);
            }
            pineScript += '\n';
        }

        if (symbolsWithShort.length > 0) {
            pineScript += 'shortOpenClose = ';
            if (symbolsWithShort.length === 1) {
                pineScript += `isSymbol("${symbolsWithShort[0]}") ? get${symbolsWithShort[0]}ShortOpenClose() : false`;
            } else {
                pineScript += symbolsWithShort
                    .map((s, i) => i === 0 ? `isSymbol("${s}") ? get${s}ShortOpenClose()` : `(isSymbol("${s}") ? get${s}ShortOpenClose()`)
                    .join(' : ') + ' : false' + ')'.repeat(symbolsWithShort.length - 1);
            }
            pineScript += '\n';
        }

        // 시각화
        pineScript += `
// ============== 시각화 ==============
bgcolor(longPos ? color.new(color.green, 80) : na, title="Long Position")
bgcolor(shortPos ? color.new(color.red, 80) : na, title="Short Position")
plotshape(longOpenClose, style=shape.triangleup, location=location.belowbar, color=color.green, size=size.tiny, title="Long")
plotshape(shortOpenClose, style=shape.triangledown, location=location.abovebar, color=color.red, size=size.tiny, title="Short")
`;

        // 전체 스크립트 저장 (복사용)
        window.fullPineScript = pineScript;

        // 화면에는 요약본 표시 (처음 30줄 + 중략 + 마지막 10줄)
        const lines = pineScript.split('\n');
        let displayScript = '';

        if (lines.length > 50) {
            const firstLines = lines.slice(0, 30).join('\n');
            const lastLines = lines.slice(-10).join('\n');
            const omittedCount = lines.length - 40;
            displayScript = `${firstLines}\n\n... (중략: ${omittedCount}줄) ...\n\n${lastLines}`;
        } else {
            displayScript = pineScript;
        }

        document.getElementById('pinescriptContainer').textContent = displayScript;
        showStatus('✅ Pine Script 생성 완료! (총 ' + lines.length + '줄)', 'success');

    } catch (error) {
        showStatus(`❌ Pine Script 생성 실패: ${error.message}`, 'error');
        console.error('Error generating Pine Script:', error);
    }
}


// ========== Pine Script 복사 ==========
function copyPineScript() {
    // 전체 스크립트 복사 (요약본이 아닌 원본)
    const pineScript = window.fullPineScript || document.getElementById('pinescriptContainer').textContent;

    if (!pineScript || pineScript.includes('Pine Script를 생성하려면')) {
        showStatus('⚠️ 먼저 Pine Script를 생성해주세요', 'error');
        return;
    }

    navigator.clipboard.writeText(pineScript).then(() => {
        showStatus('✅ Pine Script가 클립보드에 복사되었습니다!', 'success');
    }).catch(err => {
        showStatus('❌ 복사 실패: ' + err.message, 'error');
    });
}

// ========== 거래 편집 모달 ==========
async function openEditModal(positionId) {
    console.log('openEditModal 호출됨, positionId:', positionId, 'type:', typeof positionId);

    try {
        const trades = await getAllTradesFromIndexedDB();
        console.log('전체 거래 수:', trades.length);

        // positionId를 가진 모든 주문 찾기
        const positionTrades = trades.filter(t => t.positionID == positionId || t.positionID === positionId || t.positionID?.toString() === positionId);
        console.log('해당 포지션의 거래 수:', positionTrades.length);

        if (positionTrades.length === 0) {
            showStatus('❌ 거래를 찾을 수 없습니다', 'error');
            console.error('매칭 실패. 찾으려는 positionID:', positionId);
            return;
        }

        // 시간순 정렬하여 첫 번째 주문 가져오기
        positionTrades.sort((a, b) => a.time - b.time);
        const firstTrade = positionTrades[0];

        console.log('첫 번째 거래:', firstTrade);

        // 모달 내용 채우기 (positionId 저장)
        document.getElementById('editOrderId').value = positionId;

        // 진입방식: 값이 없으면 기본값 찾기
        const entryMethodSelect = document.getElementById('editEntryMethod');
        if (firstTrade.entryMethod) {
            entryMethodSelect.value = firstTrade.entryMethod;
        } else {
            // 기본값 찾기
            const settings = loadSettings();
            const defaultEntry = settings.entryMethods.find(opt => opt.isDefault);
            entryMethodSelect.value = defaultEntry ? defaultEntry.value : '';
        }

        // 감정상태: 값이 없으면 기본값 찾기
        const emotionSelect = document.getElementById('editEmotion');
        if (firstTrade.emotion) {
            emotionSelect.value = firstTrade.emotion;
        } else {
            // 기본값 찾기
            const settings = loadSettings();
            const defaultEmotion = settings.emotions.find(opt => opt.isDefault);
            emotionSelect.value = defaultEmotion ? defaultEmotion.value : '';
        }

        document.getElementById('editRuleCompliance').value = firstTrade.ruleCompliance !== null ? firstTrade.ruleCompliance.toString() : '';
        document.getElementById('editMemo').value = firstTrade.memo || '';

        // 모달 표시
        const modal = document.getElementById('editModal');
        console.log('모달 요소:', modal);
        modal.style.display = 'flex';
        console.log('모달 표시 완료');
    } catch (error) {
        console.error('openEditModal 에러:', error);
        showStatus('❌ 오류: ' + error.message, 'error');
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveTradeEdit() {
    const positionId = document.getElementById('editOrderId').value;
    const entryMethod = document.getElementById('editEntryMethod').value;
    const emotion = document.getElementById('editEmotion').value;
    const ruleComplianceValue = document.getElementById('editRuleCompliance').value;
    const ruleCompliance = ruleComplianceValue === '' ? null : ruleComplianceValue === 'true';
    const memo = document.getElementById('editMemo').value;

    try {
        // 해당 positionId를 가진 모든 주문 찾기
        const trades = await getAllTradesFromIndexedDB();
        const positionTrades = trades.filter(t => t.positionID == positionId || t.positionID === positionId || t.positionID?.toString() === positionId);

        console.log(`포지션 ${positionId}의 ${positionTrades.length}개 주문 업데이트 중...`);

        // 모든 주문에 동일한 데이터 저장
        for (const trade of positionTrades) {
            await updateTradeInIndexedDB(trade.orderId, {
                entryMethod,
                emotion,
                ruleCompliance,
                memo
            });
        }

        showStatus('✅ 거래 정보가 업데이트되었습니다', 'success');
        closeEditModal();
        await loadAndDisplayTrades();

    } catch (error) {
        showStatus(`❌ 저장 실패: ${error.message}`, 'error');
        console.error('Error saving trade edit:', error);
    }
}

// ========== 엑셀(CSV) 내보내기 ==========
async function exportToCSV() {
    try {
        const trades = await getAllTradesFromIndexedDB();

        if (trades.length === 0) {
            showStatus('⚠️ 내보낼 데이터가 없습니다', 'error');
            return;
        }

        // CSV 헤더
        const headers = [
            '날짜',
            '시간',
            '종목',
            '방향',
            '진입가격',
            '수량',
            '손익($)',
            '손익(%)',
            '보유시간',
            '진입방식',
            '감정상태',
            '규칙준수',
            '메모',
            'OrderID',
            'PositionID'
        ];

        // CSV 데이터 생성
        const rows = [headers];

        // 최신순으로 정렬 (최신 거래가 맨 위)
        trades.sort((a, b) => b.time - a.time);

        trades.forEach(trade => {
            const date = new Date(trade.time);
            const dateStr = date.toLocaleDateString('ko-KR');
            const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

            // 손익(%) 계산
            const positionValue = trade.price * trade.executedQty;
            const profitPercent = positionValue > 0 ? ((trade.profit / positionValue) * 100).toFixed(2) : '0.00';

            // 보유시간 계산
            const holdingTimeData = calculatePositionHoldingTime(trade, trades);
            const holdingTime = holdingTimeData ? holdingTimeData.formatted : '';

            // 숫자 포맷팅
            const formattedPrice = parseFloat(trade.price || 0).toFixed(2);
            const formattedQty = parseFloat(trade.executedQty || 0).toFixed(4);
            const formattedProfit = parseFloat(trade.profit || 0).toFixed(2);

            const row = [
                dateStr,
                timeStr,
                trade.symbol,
                trade.positionSide,
                formattedPrice,
                formattedQty,
                formattedProfit,
                profitPercent,
                holdingTime,
                trade.entryMethod || '',
                trade.emotion || '',
                trade.ruleCompliance === true ? '준수' : trade.ruleCompliance === false ? '미준수' : '',
                (trade.memo || '').replace(/,/g, '，').replace(/\n/g, ' '), // CSV 호환
                trade.orderId,
                trade.positionID || ''
            ];

            rows.push(row);
        });

        // CSV 문자열 생성 (UTF-8 BOM 추가 - 엑셀 한글 깨짐 방지)
        const csvContent = '\uFEFF' + rows.map(row => row.join(',')).join('\n');

        // 다운로드
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BingX_거래일지_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        showStatus('✅ CSV 파일이 다운로드되었습니다', 'success');

    } catch (error) {
        showStatus(`❌ 내보내기 실패: ${error.message}`, 'error');
        console.error('Error exporting to CSV:', error);
    }
}

// ========== JSON 백업 ==========
async function exportToJSON() {
    try {
        const trades = await getAllTradesFromIndexedDB();

        if (trades.length === 0) {
            showStatus('⚠️ 백업할 데이터가 없습니다', 'error');
            return;
        }

        // API 키와 설정 정보도 함께 백업
        const apiKey = document.getElementById('apiKey').value;
        const secretKey = document.getElementById('secretKey').value;
        const datePeriod = document.getElementById('datePeriod').value;
        const userSettings = loadSettings(); // 사용자 커스텀 설정

        const backup = {
            version: '1.2',
            exportDate: new Date().toISOString(),
            totalTrades: trades.length,
            settings: {
                apiKey: apiKey,
                secretKey: secretKey,
                datePeriod: datePeriod
            },
            userSettings: userSettings, // 진입방식, 감정상태 등 커스텀 설정
            trades: trades
        };

        const jsonContent = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BingX_백업_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        showStatus('✅ JSON 백업 파일이 다운로드되었습니다', 'success');

    } catch (error) {
        showStatus(`❌ 백업 실패: ${error.message}`, 'error');
        console.error('Error exporting to JSON:', error);
    }
}

// ========== JSON 복원 ==========
async function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showLoading(true);

        const text = await file.text();
        const backup = JSON.parse(text);

        if (!backup.trades || !Array.isArray(backup.trades)) {
            throw new Error('잘못된 백업 파일 형식입니다');
        }

        // 기존 데이터 확인
        const existingTrades = await getAllTradesFromIndexedDB();
        const shouldMerge = existingTrades.length > 0 &&
            confirm(`기존 데이터 ${existingTrades.length}개가 있습니다.\n\n확인: 기존 데이터와 병합\n취소: 기존 데이터 삭제 후 복원`);

        if (!shouldMerge && existingTrades.length > 0) {
            await clearAllData(false);
        }

        // 데이터 복원
        let importedCount = 0;
        for (const trade of backup.trades) {
            const saved = await saveTradeToIndexedDB(trade);
            if (saved) importedCount++;
        }

        // 설정 복원 (버전 1.1 이상)
        if (backup.settings) {
            if (backup.settings.apiKey) {
                document.getElementById('apiKey').value = backup.settings.apiKey;
            }
            if (backup.settings.secretKey) {
                document.getElementById('secretKey').value = backup.settings.secretKey;
            }
            if (backup.settings.datePeriod) {
                document.getElementById('datePeriod').value = backup.settings.datePeriod;
            }

            // API 키 저장 체크박스가 체크되어 있으면 localStorage에도 저장
            const saveKeys = document.getElementById('saveKeys').checked;
            if (saveKeys && backup.settings.apiKey && backup.settings.secretKey) {
                localStorage.setItem('bingx_api_key', btoa(backup.settings.apiKey));
                localStorage.setItem('bingx_secret_key', btoa(backup.settings.secretKey));
            }
        }

        // 사용자 커스텀 설정 복원 (버전 1.2 이상)
        if (backup.userSettings) {
            saveSettingsToStorage(backup.userSettings);
            updateEditModalOptions();
            console.log('사용자 커스텀 설정이 복원되었습니다');
        }

        showStatus(`✅ ${importedCount}개의 거래가 복원되었습니다`, 'success');
        await loadAndDisplayTrades();

    } catch (error) {
        showStatus(`❌ 복원 실패: ${error.message}`, 'error');
        console.error('Error importing from JSON:', error);
    } finally {
        showLoading(false);
        event.target.value = ''; // 파일 선택 초기화
    }
}

// ========== CSV 업로드 ==========
async function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showLoading(true);

        const text = await file.text();
        const lines = text.split('\n');

        if (lines.length < 2) {
            throw new Error('CSV 파일이 비어있거나 형식이 잘못되었습니다');
        }

        // 헤더 파싱 (BOM 제거)
        const header = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());

        // 필요한 컬럼 인덱스 찾기
        const positionIDIdx = header.indexOf('PositionID');
        const entryMethodIdx = header.indexOf('진입방식');
        const emotionIdx = header.indexOf('감정상태');
        const ruleComplianceIdx = header.indexOf('규칙준수');
        const memoIdx = header.indexOf('메모');

        if (positionIDIdx === -1) {
            throw new Error('CSV 파일에 PositionID 컬럼이 없습니다. 올바른 형식의 파일을 업로드해주세요.');
        }

        // 기존 데이터 가져오기
        const existingTrades = await getAllTradesFromIndexedDB();

        let updatedCount = 0;
        let notFoundCount = 0;

        // 각 행 처리
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // 빈 줄 건너뛰기

            const values = parseCSVLine(line);

            const positionID = values[positionIDIdx]?.trim();
            if (!positionID) continue; // PositionID가 없으면 건너뛰기

            // PositionID로 매칭되는 모든 거래 찾기
            const matchingTrades = existingTrades.filter(t => t.positionID === positionID);

            if (matchingTrades.length === 0) {
                notFoundCount++;
                continue;
            }

            // 거래 정보 업데이트
            const updates = {};

            if (entryMethodIdx !== -1 && values[entryMethodIdx]) {
                updates.entryMethod = values[entryMethodIdx].trim();
            }

            if (emotionIdx !== -1 && values[emotionIdx]) {
                updates.emotion = values[emotionIdx].trim();
            }

            if (ruleComplianceIdx !== -1 && values[ruleComplianceIdx]) {
                const ruleValue = values[ruleComplianceIdx].trim();
                if (ruleValue === '준수') {
                    updates.ruleCompliance = true;
                } else if (ruleValue === '미준수') {
                    updates.ruleCompliance = false;
                }
            }

            if (memoIdx !== -1 && values[memoIdx]) {
                // CSV에서 이스케이프된 쉼표와 줄바꿈 복원
                updates.memo = values[memoIdx].replace(/，/g, ',').trim();
            }

            // 같은 PositionID를 가진 모든 거래에 동일한 정보 적용
            for (const trade of matchingTrades) {
                const updatedTrade = { ...trade, ...updates };
                await saveTradeToIndexedDB(updatedTrade);
                updatedCount++;
            }
        }

        showStatus(`✅ ${updatedCount}개의 거래 정보가 업데이트되었습니다${notFoundCount > 0 ? ` (${notFoundCount}개 미매칭)` : ''}`, 'success');
        await loadAndDisplayTrades();

    } catch (error) {
        showStatus(`❌ CSV 업로드 실패: ${error.message}`, 'error');
        console.error('Error importing from CSV:', error);
    } finally {
        showLoading(false);
        event.target.value = ''; // 파일 선택 초기화
    }
}

// CSV 라인 파싱 헬퍼 (쉼표와 따옴표 처리)
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // 이스케이프된 따옴표
                current += '"';
                i++;
            } else {
                // 따옴표 시작/끝
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // 필드 구분자
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current); // 마지막 필드
    return values;
}

// ========== 데이터 초기화 ==========
async function clearAllData(showConfirm = true) {
    if (showConfirm && !confirm('모든 거래 데이터를 삭제하시겠습니까?')) {
        return;
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = async () => {
            if (showConfirm) {
                showStatus('✅ 모든 데이터가 삭제되었습니다', 'success');
                await loadAndDisplayTrades();
            }
            resolve();
        };

        request.onerror = () => reject(request.error);
    });
}

// ========== UI 헬퍼 함수 ==========
function toggleApiSection() {
    const sections = document.querySelectorAll('.api-section');
    sections[0].classList.toggle('collapsed'); // 환경설정 섹션
}

function toggleDebugSection() {
    const sections = document.querySelectorAll('.api-section');
    sections[1].classList.toggle('collapsed'); // 디버깅 섹션
}

// ========== API 키 계정 정보 확인 ==========
async function checkApiAccount() {
    showStatus('🔍 API 키 계정 정보 확인 중...', 'info');
    console.log('\n========== API 키 계정 정보 ==========');

    try {
        // 1. Perpetual Futures (USDT-M) 잔고 조회
        console.log('\n📊 Perpetual Futures (USDT-M) 잔고:');
        try {
            const perpetualData = await makeApiRequest('/openApi/swap/v2/user/balance', {});

            if (perpetualData.balance && parseFloat(perpetualData.balance.balance) > 0) {
                console.log(`   USDT 잔고: ${perpetualData.balance.balance}`);
                console.log(`   사용 가능: ${perpetualData.balance.availableMargin}`);
                if (parseFloat(perpetualData.balance.unrealizedProfit) !== 0) {
                    console.log(`   미실현 손익: ${perpetualData.balance.unrealizedProfit}`);
                }
            } else {
                console.log('   (잔고 없음)');
            }
        } catch (error) {
            console.error(`   ❌ Perpetual Futures 잔고 조회 실패: ${error.message}`);
        }

        // 2. Standard Futures 잔고 조회
        console.log('\n📊 Standard Futures 잔고:');
        try {
            const standardData = await makeApiRequest('/openApi/contract/v1/balance', {});

            if (Array.isArray(standardData) && standardData.length > 0) {
                // VST 같은 테스트 자산 제외, 실제 거래 자산만 표시
                const assetsWithBalance = standardData.filter(asset =>
                    parseFloat(asset.balance) > 0 && asset.asset !== 'VST'
                );

                if (assetsWithBalance.length > 0) {
                    assetsWithBalance.forEach(asset => {
                        console.log(`   [${asset.asset}]`);
                        console.log(`     잔고: ${asset.balance}`);
                        console.log(`     사용 가능: ${asset.availableBalance}`);
                        // 미실현 손익이 0이 아닐 때만 표시
                        if (parseFloat(asset.crossUnPnl) !== 0) {
                            console.log(`     미실현 손익: ${asset.crossUnPnl}`);
                        }
                    });
                } else {
                    console.log('   (잔고 없음)');
                }
            } else {
                console.log('   (잔고 없음 또는 조회 불가)');
            }
        } catch (error) {
            console.error(`   ❌ Standard Futures 잔고 조회 실패: ${error.message}`);
        }

        showStatus('✅ API 키가 올바른 계정에 연결되어 있습니다', 'success');
    } catch (error) {
        console.error('❌ 계정 정보 조회 실패:', error);
        showStatus(`❌ API 키 오류: ${error.message}`, 'error');
    }
}

// ========== 특정 주문 조회 ==========
async function searchOrderById() {
    const symbol = prompt('심볼을 입력하세요 (예: BTC-USDT):', 'BTC-USDT');
    if (!symbol) return;

    const orderId = prompt('조회할 주문 번호를 입력하세요 (예: 1501885781960069126):');
    if (!orderId) return;

    showStatus('🔍 주문 조회 중...', 'info');
    console.log(`\n========== 주문 번호 조회: ${symbol} / ${orderId} ==========`);

    let found = false;

    // 1. Perpetual Futures 조회 시도
    console.log('\n📊 Perpetual Futures (USDT-M) 조회 중...');
    try {
        const params = {
            symbol: symbol,
            orderId: orderId
        };

        const data = await makeApiRequest('/openApi/swap/v2/trade/order', params);
        console.log('✅ Perpetual Futures에서 주문 발견:');
        console.log(data);
        found = true;
    } catch (error) {
        console.log(`   ❌ 찾기 실패: ${error.message}`);
    }

    // 2. Standard Futures 조회 시도
    if (!found) {
        console.log('\n📊 Standard Futures 조회 중...');
        try {
            const params = {
                symbol: symbol,
                orderId: orderId,
                limit: 1
            };

            const data = await makeApiRequest('/openApi/contract/v1/allOrders', params);

            if (Array.isArray(data) && data.length > 0) {
                console.log('✅ Standard Futures에서 주문 발견:');
                console.log(data[0]);
                found = true;
            } else {
                console.log('   ❌ 찾기 실패: 주문이 없습니다');
            }
        } catch (error) {
            console.log(`   ❌ 찾기 실패: ${error.message}`);
        }
    }

    if (found) {
        showStatus(`✅ 주문을 찾았습니다! 콘솔을 확인하세요`, 'success');
    } else {
        showStatus(`❌ 두 엔드포인트 모두에서 주문을 찾을 수 없습니다`, 'error');
    }
}

// ========== 최근 거래 내역 디버깅 ==========
async function debugRecentTrades() {
    showStatus('🔍 최근 거래 내역 조회 중...', 'info');
    console.log('\n========== 최근 거래 내역 디버깅 시작 ==========');

    try {
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        console.log('현재 시각:', new Date(now).toLocaleString('ko-KR'));

        let allOrders = [];

        console.log('\n📡 여러 API 엔드포인트 조회 시도...\n');

        // 병렬 처리로 최적화
        console.log('\n⚡ 병렬 처리로 조회 중...');

        const allPromises = [];

        // 1. Perpetual Futures (Swap) 조회
        console.log(`\n📊 USDT-M Perpetual Futures (Swap)`);
        for (let i = 0; i < 4; i++) {
            const endTime = now - (i * sevenDays);
            const startTime = endTime - sevenDays;

            const params = {
                limit: 500,
                startTime: startTime,
                endTime: endTime
            };

            allPromises.push(
                makeApiRequest('/openApi/swap/v2/trade/allOrders', params)
                    .then(data => {
                        if (data.orders && data.orders.length > 0) {
                            console.log(`   ✅ Perpetual 기간 ${i + 1}: ${data.orders.length}개`);
                            return data.orders.map(order => ({
                                ...order,
                                _endpoint: 'USDT-M Perpetual Futures (Swap)'
                            }));
                        }
                        return [];
                    })
                    .catch(error => {
                        console.error(`   ❌ Perpetual 기간 ${i + 1} 실패: ${error.message}`);
                        return [];
                    })
            );
        }

        // 2. Standard Futures 조회 (symbol별로)
        const standardSymbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'BNB-USDT', 'XRP-USDT'];

        console.log(`\n📊 Standard Futures (USDT Margin)`);
        for (const symbol of standardSymbols) {
            for (let i = 0; i < 4; i++) {
                const endTime = now - (i * sevenDays);
                const startTime = endTime - sevenDays;

                const params = {
                    symbol: symbol,
                    limit: 500,
                    startTime: startTime,
                    endTime: endTime
                };

                allPromises.push(
                    makeApiRequest('/openApi/contract/v1/allOrders', params)
                        .then(data => {
                            if (Array.isArray(data) && data.length > 0) {
                                console.log(`   ✅ ${symbol} 기간 ${i + 1}: ${data.length}개`);

                                // Standard Futures 데이터 정규화
                                const normalizedOrders = data.map(order => {
                                    let calculatedProfit = 0;
                                    if (order.closePrice && order.avgPrice && order.executedQty) {
                                        const priceDiff = order.closePrice - order.avgPrice;
                                        const qty = parseFloat(order.executedQty) || 0;

                                        if (order.positionSide === 'LONG') {
                                            calculatedProfit = priceDiff * qty;
                                        } else if (order.positionSide === 'SHORT') {
                                            calculatedProfit = -priceDiff * qty;
                                        }
                                    }

                                    return {
                                        ...order,
                                        positionID: order.positionId,
                                        price: order.avgPrice || order.closePrice || 0,
                                        profit: calculatedProfit,
                                        side: null,
                                        type: 'UNKNOWN',
                                        commission: 0,
                                        _endpoint: 'Standard Futures (USDT Margin)',
                                        _originalData: order
                                    };
                                });

                                return normalizedOrders;
                            }
                            return [];
                        })
                        .catch(error => {
                            console.error(`   ❌ ${symbol} 기간 ${i + 1} 실패: ${error.message}`);
                            return [];
                        })
                );
            }
        }

        // 배치 처리 실행 (28일 = 빠른 모드)
        const BATCH_SIZE = 20;
        const BATCH_DELAY = 500;

        console.log(`\n⏳ ${allPromises.length}개 요청을 ${Math.ceil(allPromises.length / BATCH_SIZE)}개 배치로 실행 중...`);

        for (let i = 0; i < allPromises.length; i += BATCH_SIZE) {
            const batch = allPromises.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(allPromises.length / BATCH_SIZE);

            console.log(`   배치 ${batchNum}/${totalBatches}: ${batch.length}개 요청 실행 중...`);
            const batchResults = await Promise.all(batch);
            batchResults.forEach(orders => {
                if (Array.isArray(orders)) {
                    allOrders.push(...orders);
                }
            });

            if (i + BATCH_SIZE < allPromises.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
        }

        // 3. Fill Orders 조회
        console.log(`\n시도 중: USDT-M Fill Orders (체결 내역)`);
        console.log(`   엔드포인트: /openApi/swap/v2/trade/allFillOrders`);

        try {
            // 한 번에 조회
            const params = {
                limit: 500,
                startTime: now - (30 * 24 * 60 * 60 * 1000),
                endTime: now
            };

            const data = await makeApiRequest('/openApi/swap/v2/trade/allFillOrders', params);

            console.log(`   API 응답:`, {
                hasOrders: !!data.orders,
                ordersLength: data.orders?.length || 0,
                responseKeys: Object.keys(data)
            });

            if (!window._apiResponseLogged) {
                console.log(`   전체 API 응답 샘플:`, data);
                window._apiResponseLogged = true;
            }

            if (data.orders && data.orders.length > 0) {
                console.log(`   ✅ ${data.orders.length}개 발견`);
                allOrders.push(...data.orders.map(order => ({
                    ...order,
                    _endpoint: 'USDT-M Fill Orders (체결 내역)'
                })));
            } else if (data.fill_orders && data.fill_orders.length > 0) {
                console.log(`   ✅ ${data.fill_orders.length}개 발견 (fill_orders)`);
                allOrders.push(...data.fill_orders.map(order => ({
                    ...order,
                    _endpoint: 'USDT-M Fill Orders (체결 내역)'
                })));
            } else {
                console.log(`   ⚠️ 데이터 없음`);
            }
        } catch (error) {
            console.log(`   ❌ 전체 오류: ${error.message}`);
        }

        if (allOrders.length === 0) {
            console.log('\n⚠️ 모든 엔드포인트에서 최근 30일 내 거래 내역 없음');

            // IndexedDB에 저장된 거래가 있는지 확인
            const savedTrades = await getAllTradesFromIndexedDB();
            if (savedTrades.length > 0) {
                console.log(`\n📁 그러나 IndexedDB에는 ${savedTrades.length}개의 거래가 저장되어 있습니다`);

                // 시간 범위 확인
                const times = savedTrades.map(t => t.time).sort((a, b) => a - b);
                const oldest = new Date(times[0]);
                const newest = new Date(times[times.length - 1]);

                console.log('저장된 거래 기간:');
                console.log(`   최초: ${oldest.toLocaleString('ko-KR')}`);
                console.log(`   최신: ${newest.toLocaleString('ko-KR')}`);
                console.log(`   (${Math.floor((now - times[times.length - 1]) / (1000 * 60 * 60))}시간 전)`);

                showStatus(`⚠️ API에서 최근 30일 거래가 없지만, DB에는 ${savedTrades.length}개 저장되어 있습니다. 콘솔을 확인하세요.`, 'info');
            } else {
                showStatus('최근 7일 내 거래 내역이 없습니다.', 'info');
            }
            return;
        }

        // 중복 제거 (orderId 기준)
        const uniqueOrdersMap = new Map();
        allOrders.forEach(order => {
            if (!uniqueOrdersMap.has(order.orderId)) {
                uniqueOrdersMap.set(order.orderId, order);
            }
        });

        const data = { orders: Array.from(uniqueOrdersMap.values()) };

        console.log(`\n📊 총 ${data.orders.length}개의 최근 거래 발견`);

        // 시간순으로 정렬 (최신순)
        const sortedOrders = data.orders.sort((a, b) => b.time - a.time);

        // 엔드포인트별 집계
        const endpointCounts = {};
        sortedOrders.forEach(order => {
            const endpoint = order._endpoint || 'Unknown';
            endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
        });

        console.log('\n엔드포인트별 거래 수:');
        Object.entries(endpointCounts).forEach(([endpoint, count]) => {
            console.log(`   ${endpoint}: ${count}개`);
        });

        // 최근 10개 거래 상세 정보
        console.log('\n최근 10개 거래 상세:');
        sortedOrders.slice(0, 10).forEach((order, index) => {
            console.log(`\n[${index + 1}] ${order.symbol} ${order.positionSide}`);
            console.log(`   출처: ${order._endpoint || 'N/A'}`);
            console.log(`   주문ID: ${order.orderId}`);
            console.log(`   포지션ID: ${order.positionID || 'N/A'}`);
            console.log(`   거래시간: ${new Date(order.time).toLocaleString('ko-KR')}`);
            console.log(`   업데이트: ${order.updateTime ? new Date(order.updateTime).toLocaleString('ko-KR') : 'N/A'}`);
            console.log(`   상태: ${order.status}`);
            console.log(`   타입: ${order.type}`);
            console.log(`   Side: ${order.side}`);
            console.log(`   가격: ${order.price}`);
            console.log(`   수량: ${order.volume}`);
            console.log(`   손익: ${order.profit || 'N/A'}`);
        });

        // IndexedDB의 최근 거래와 비교
        const savedTrades = await getAllTradesFromIndexedDB();
        console.log(`\n📁 IndexedDB에 저장된 거래: ${savedTrades.length}개`);

        // API에는 있는데 DB에 없는 거래 찾기
        const savedOrderIds = new Set(savedTrades.map(t => String(t.orderId)));
        const missingTrades = sortedOrders.filter(order => !savedOrderIds.has(String(order.orderId)));

        if (missingTrades.length > 0) {
            console.log(`\n⚠️ API에는 있지만 DB에 없는 거래: ${missingTrades.length}개`);
            missingTrades.forEach((trade, index) => {
                console.log(`   ${index + 1}. ${trade.symbol} ${trade.positionSide} - ${new Date(trade.time).toLocaleString('ko-KR')}`);
            });
            showStatus(`⚠️ API에는 있지만 저장되지 않은 거래 ${missingTrades.length}개 발견! 콘솔을 확인하세요`, 'error');
        } else {
            console.log('\n✅ 모든 최근 거래가 DB에 저장되어 있습니다');
            showStatus('✅ 최근 거래가 모두 저장되어 있습니다', 'success');
        }

        // 심볼별 집계
        const symbolStats = {};
        sortedOrders.forEach(order => {
            if (!symbolStats[order.symbol]) {
                symbolStats[order.symbol] = { LONG: 0, SHORT: 0 };
            }
            symbolStats[order.symbol][order.positionSide]++;
        });

        console.log('\n심볼별 거래 통계:');
        Object.keys(symbolStats).forEach(symbol => {
            console.log(`   ${symbol}: Long ${symbolStats[symbol].LONG}개, Short ${symbolStats[symbol].SHORT}개`);
        });

        // 현재 보유 포지션 조회
        console.log('\n========== 현재 보유 포지션 조회 ==========');
        try {
            const positionsData = await makeApiRequest('/openApi/swap/v2/user/positions', {});

            if (positionsData && positionsData.length > 0) {
                console.log(`\n📍 현재 보유 중인 포지션: ${positionsData.length}개`);
                positionsData.forEach((pos, index) => {
                    console.log(`\n[포지션 ${index + 1}] ${pos.symbol} ${pos.positionSide}`);
                    console.log(`   포지션ID: ${pos.positionId || 'N/A'}`);
                    console.log(`   진입가격: ${pos.avgPrice || pos.entryPrice}`);
                    console.log(`   수량: ${pos.positionAmt || pos.volume}`);
                    console.log(`   미실현손익: ${pos.unrealizedProfit || 'N/A'}`);
                    console.log(`   레버리지: ${pos.leverage}x`);
                });
            } else {
                console.log('   ⚠️ 현재 보유 중인 포지션 없음');
            }
        } catch (error) {
            console.log(`   ❌ 포지션 조회 실패: ${error.message}`);
        }

        // 미체결 주문 조회
        console.log('\n========== 미체결 주문 조회 ==========');
        try {
            const openOrdersData = await makeApiRequest('/openApi/swap/v2/trade/openOrders', {});

            if (openOrdersData && openOrdersData.orders && openOrdersData.orders.length > 0) {
                console.log(`\n📋 미체결 주문: ${openOrdersData.orders.length}개`);
                openOrdersData.orders.forEach((order, index) => {
                    console.log(`\n[미체결 ${index + 1}] ${order.symbol} ${order.positionSide}`);
                    console.log(`   주문ID: ${order.orderId}`);
                    console.log(`   타입: ${order.type}`);
                    console.log(`   Side: ${order.side}`);
                    console.log(`   가격: ${order.price}`);
                    console.log(`   수량: ${order.volume}`);
                    console.log(`   상태: ${order.status}`);
                    console.log(`   생성시간: ${new Date(order.time).toLocaleString('ko-KR')}`);
                });
            } else {
                console.log('   ⚠️ 미체결 주문 없음');
            }
        } catch (error) {
            console.log(`   ❌ 미체결 주문 조회 실패: ${error.message}`);
        }

        console.log('\n========== 디버깅 종료 ==========\n');

    } catch (error) {
        console.error('❌ 디버깅 실패:', error);
        showStatus(`❌ 디버깅 실패: ${error.message}`, 'error');
    }
}

// ========== RR 계산기 ==========

// RR Calculator 클래스
class RRCalculator {
    constructor() {
        this.entries = [];
        this.stopLoss = null;
        this.takeProfit = null;
        this.side = 'LONG';
    }

    addEntry(price, quantity) {
        this.entries.push({
            price: parseFloat(price),
            quantity: parseFloat(quantity)
        });
    }

    removeEntry(index) {
        this.entries.splice(index, 1);
    }

    clearEntries() {
        this.entries = [];
    }

    setSide(side) {
        this.side = side;
    }

    setStopLoss(price) {
        this.stopLoss = parseFloat(price);
    }

    setTakeProfit(price) {
        this.takeProfit = parseFloat(price);
    }

    getAverageEntry() {
        if (this.entries.length === 0) return 0;

        let totalValue = 0;
        let totalQty = 0;

        this.entries.forEach(entry => {
            totalValue += entry.price * entry.quantity;
            totalQty += entry.quantity;
        });

        return totalQty > 0 ? totalValue / totalQty : 0;
    }

    getTotalQuantity() {
        return this.entries.reduce((sum, e) => sum + e.quantity, 0);
    }

    getTotalValue() {
        return this.entries.reduce((sum, e) => sum + (e.price * e.quantity), 0);
    }

    getRisk() {
        if (!this.stopLoss || this.entries.length === 0) return 0;

        const avgEntry = this.getAverageEntry();
        const totalQty = this.getTotalQuantity();

        if (this.side === 'LONG') {
            return (avgEntry - this.stopLoss) * totalQty;
        } else {
            return (this.stopLoss - avgEntry) * totalQty;
        }
    }

    getReward() {
        if (!this.takeProfit || this.entries.length === 0) return 0;

        const avgEntry = this.getAverageEntry();
        const totalQty = this.getTotalQuantity();

        if (this.side === 'LONG') {
            return (this.takeProfit - avgEntry) * totalQty;
        } else {
            return (avgEntry - this.takeProfit) * totalQty;
        }
    }

    getRRRatio() {
        const risk = this.getRisk();
        if (risk === 0) return 0;

        const reward = this.getReward();
        return reward / risk;
    }

    simulateNewEntry(newPrice, newQuantity) {
        const tempCalc = new RRCalculator();
        tempCalc.entries = [...this.entries];
        tempCalc.side = this.side;
        tempCalc.stopLoss = this.stopLoss;
        tempCalc.takeProfit = this.takeProfit;
        tempCalc.addEntry(newPrice, newQuantity);

        return {
            avgEntry: tempCalc.getAverageEntry(),
            totalQty: tempCalc.getTotalQuantity(),
            totalValue: tempCalc.getTotalValue(),
            risk: tempCalc.getRisk(),
            reward: tempCalc.getReward(),
            rrRatio: tempCalc.getRRRatio()
        };
    }
}

// 전역 RR Calculator 인스턴스
let rrCalc = new RRCalculator();

// 진입 행 추가
function addEntryRow() {
    const tbody = document.getElementById('rrEntriesBody');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td><input type="number" class="rr-entry-price" placeholder="100000" step="0.01" oninput="updateRRCalculation()"></td>
        <td><input type="number" class="rr-entry-qty" placeholder="0.1" step="0.0001" oninput="updateRRCalculation()"></td>
        <td class="rr-entry-value">-</td>
        <td><button class="delete-btn" onclick="removeEntryRow(this)">삭제</button></td>
    `;

    tbody.appendChild(row);
}

// 진입 행 삭제
function removeEntryRow(btn) {
    const row = btn.closest('tr');
    const tbody = document.getElementById('rrEntriesBody');

    // 최소 1개는 유지
    if (tbody.children.length > 1) {
        row.remove();
        updateRRCalculation();
    } else {
        showStatus('⚠️ 최소 1개의 진입은 필요합니다', 'error');
    }
}

// RR 계산 업데이트
function updateRRCalculation() {
    // 진입 데이터 수집
    rrCalc.clearEntries();

    const rows = document.querySelectorAll('#rrEntriesBody tr');
    rows.forEach((row, index) => {
        const priceInput = row.querySelector('.rr-entry-price');
        const qtyInput = row.querySelector('.rr-entry-qty');
        const valueCell = row.querySelector('.rr-entry-value');
        const deleteBtn = row.querySelector('.delete-btn');

        const price = parseFloat(priceInput.value) || 0;
        const qty = parseFloat(qtyInput.value) || 0;

        if (price > 0 && qty > 0) {
            rrCalc.addEntry(price, qty);
            const value = price * qty;
            valueCell.textContent = '$' + value.toFixed(2);
        } else {
            valueCell.textContent = '-';
        }

        // 첫 번째 행은 삭제 버튼 숨김
        if (index === 0 && rows.length === 1) {
            deleteBtn.style.visibility = 'hidden';
        } else {
            deleteBtn.style.visibility = 'visible';
        }
    });

    // 거래 방향
    const sideRadios = document.getElementsByName('rrSide');
    for (const radio of sideRadios) {
        if (radio.checked) {
            rrCalc.setSide(radio.value);
            break;
        }
    }

    // 손절/익절
    const stopLoss = parseFloat(document.getElementById('rrStopLoss').value) || null;
    const takeProfit = parseFloat(document.getElementById('rrTakeProfit').value) || null;

    if (stopLoss) rrCalc.setStopLoss(stopLoss);
    if (takeProfit) rrCalc.setTakeProfit(takeProfit);

    // 결과 표시
    displayRRResults();
}

// 결과 표시
function displayRRResults() {
    const avgEntry = rrCalc.getAverageEntry();
    const totalQty = rrCalc.getTotalQuantity();
    const totalValue = rrCalc.getTotalValue();
    const risk = rrCalc.getRisk();
    const reward = rrCalc.getReward();
    const rrRatio = rrCalc.getRRRatio();

    // 포지션 요약
    document.getElementById('rrAvgEntry').textContent = avgEntry > 0
        ? avgEntry.toFixed(2) + ' USDT'
        : '-';

    document.getElementById('rrTotalQty').textContent = totalQty > 0
        ? totalQty.toFixed(4) + ' BTC'
        : '-';

    document.getElementById('rrTotalValue').textContent = totalValue > 0
        ? '$' + totalValue.toFixed(2)
        : '-';

    // 손익
    const riskEl = document.getElementById('rrRisk');
    const rewardEl = document.getElementById('rrReward');

    if (risk > 0) {
        const riskPercent = ((risk / totalValue) * 100).toFixed(2);
        riskEl.textContent = `-$${risk.toFixed(2)} (-${riskPercent}%)`;
    } else {
        riskEl.textContent = '-';
    }

    if (reward > 0) {
        const rewardPercent = ((reward / totalValue) * 100).toFixed(2);
        rewardEl.textContent = `+$${reward.toFixed(2)} (+${rewardPercent}%)`;
    } else {
        rewardEl.textContent = '-';
    }

    // RR 비율
    const ratioEl = document.getElementById('rrRatio');
    if (rrRatio > 0) {
        ratioEl.textContent = rrRatio.toFixed(2) + ':1';

        // 색상 변경
        if (rrRatio >= 3) {
            ratioEl.style.color = '#10B981'; // 초록
        } else if (rrRatio >= 2) {
            ratioEl.style.color = 'var(--color-primary)'; // 파랑
        } else if (rrRatio >= 1) {
            ratioEl.style.color = '#F59E0B'; // 주황
        } else {
            ratioEl.style.color = '#EF4444'; // 빨강
        }
    } else {
        ratioEl.textContent = '-';
        ratioEl.style.color = 'var(--color-primary)';
    }
}

// 시뮬레이션 실행
function runSimulation() {
    const simPrice = parseFloat(document.getElementById('rrSimPrice').value);
    const simQty = parseFloat(document.getElementById('rrSimQty').value);

    if (!simPrice || !simQty) {
        showStatus('⚠️ 시뮬레이션 가격과 수량을 입력하세요', 'error');
        return;
    }

    if (rrCalc.entries.length === 0) {
        showStatus('⚠️ 먼저 진입 내역을 입력하세요', 'error');
        return;
    }

    const result = rrCalc.simulateNewEntry(simPrice, simQty);

    // 결과 표시
    const resultDiv = document.getElementById('rrSimResult');
    resultDiv.style.display = 'block';

    let rrColor = 'var(--color-primary)';
    if (result.rrRatio >= 3) rrColor = '#10B981';
    else if (result.rrRatio >= 2) rrColor = 'var(--color-primary)';
    else if (result.rrRatio >= 1) rrColor = '#F59E0B';
    else rrColor = '#EF4444';

    const riskPercent = ((result.risk / result.totalValue) * 100).toFixed(2);
    const rewardPercent = ((result.reward / result.totalValue) * 100).toFixed(2);

    const avgEntryStr = result.avgEntry.toFixed(2);
    const totalQtyStr = result.totalQty.toFixed(4);
    const totalValueStr = result.totalValue.toFixed(2);
    const riskStr = result.risk.toFixed(2);
    const rewardStr = result.reward.toFixed(2);
    const rrRatioStr = result.rrRatio.toFixed(2);

    resultDiv.innerHTML = `
        <div style="font-size: 14px; color: var(--color-text-primary); margin-bottom: 12px;">
            <strong>추가 진입 후 예상:</strong>
        </div>
        <div style="display: grid; gap: 8px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between;">
                <span>평균 진입가:</span>
                <strong>${avgEntryStr} USDT</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>총 수량:</span>
                <strong>${totalQtyStr} BTC</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>총 금액:</span>
                <strong>$${totalValueStr}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #EF4444;">
                <span>Risk:</span>
                <strong>-$${riskStr} (-${riskPercent}%)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #10B981;">
                <span>Reward:</span>
                <strong>+$${rewardStr} (+${rewardPercent}%)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--color-border);">
                <span>예상 RR:</span>
                <strong style="color: ${rrColor}; font-size: 18px;">${rrRatioStr}:1</strong>
            </div>
        </div>
    `;

    showStatus('✅ 시뮬레이션 완료', 'success');
}

// 현재 포지션 불러오기
async function loadCurrentPositions() {
    try {
        showStatus('🔄 현재 포지션 조회 중...', 'info');

        const apiKey = document.getElementById('apiKey').value;
        const secretKey = document.getElementById('secretKey').value;

        if (!apiKey || !secretKey) {
            showStatus('⚠️ API 키를 먼저 설정하세요', 'error');
            return;
        }

        // Perpetual Futures 포지션 조회 (makeApiRequest가 자체적으로 timestamp와 signature 생성)
        const positions = await makeApiRequest('/openApi/swap/v2/user/positions', {});

        const select = document.getElementById('rrPositionSelect');
        select.innerHTML = '<option value="">포지션을 선택하거나 수동 입력하세요</option>';

        if (Array.isArray(positions) && positions.length > 0) {
            positions.forEach((pos, index) => {
                const unrealizedProfit = parseFloat(pos.unrealizedProfit) || 0;
                const profitSign = unrealizedProfit >= 0 ? '+' : '';

                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${pos.symbol} ${pos.positionSide} | ${parseFloat(pos.positionAmt).toFixed(4)} @ ${parseFloat(pos.avgPrice).toFixed(2)} | ${profitSign}${unrealizedProfit.toFixed(2)}$`;
                option.dataset.position = JSON.stringify(pos);

                select.appendChild(option);
            });

            showStatus(`✅ ${positions.length}개 포지션 로드됨`, 'success');
        } else {
            showStatus('⚠️ 현재 보유 포지션이 없습니다', 'info');
        }

    } catch (error) {
        showStatus(`❌ 포지션 조회 실패: ${error.message}`, 'error');
        console.error('Error loading positions:', error);
    }
}

// 포지션을 계산기에 로드
function loadPositionToCalculator() {
    const select = document.getElementById('rrPositionSelect');
    const selectedOption = select.options[select.selectedIndex];

    if (!selectedOption.dataset.position) return;

    const position = JSON.parse(selectedOption.dataset.position);

    // 기존 진입 내역 초기화
    const tbody = document.getElementById('rrEntriesBody');
    tbody.innerHTML = '';

    // 포지션 데이터로 첫 행 추가
    const row = document.createElement('tr');
    const avgPriceStr = parseFloat(position.avgPrice).toFixed(2);
    const posAmtStr = Math.abs(parseFloat(position.positionAmt)).toFixed(4);

    row.innerHTML = `
        <td><input type="number" class="rr-entry-price" value="${avgPriceStr}" step="0.01" oninput="updateRRCalculation()"></td>
        <td><input type="number" class="rr-entry-qty" value="${posAmtStr}" step="0.0001" oninput="updateRRCalculation()"></td>
        <td class="rr-entry-value">-</td>
        <td><button class="delete-btn" onclick="removeEntryRow(this)" style="visibility: hidden;">삭제</button></td>
    `;
    tbody.appendChild(row);

    // 거래 방향 설정
    const sideRadios = document.getElementsByName('rrSide');
    for (const radio of sideRadios) {
        radio.checked = (radio.value === position.positionSide);
    }

    // 계산 업데이트
    updateRRCalculation();

    showStatus(`✅ ${position.symbol} ${position.positionSide} 포지션 로드됨`, 'success');
}
