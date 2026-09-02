


import { CommonModule, JsonPipe, KeyValuePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import { timestamp } from 'rxjs/operators';
import { CdkDragDrop, copyArrayItem, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';


import { MatIcon } from '@angular/material/icon';         // 1. 確保有引入 MatIcon


// import pool_data from './pool_json.json'; // 根據你的檔案實際相對路徑調整
@Component({
  selector: 'app-index',
  imports: [FormsModule, RouterOutlet, RouterLink, RouterLinkActive,
    JsonPipe,
    KeyValuePipe,
    MatIcon,         // <-- 加上這行，解決 <mat-icon> 錯誤
    DragDropModule,   // <-- 加上這行，解決 cdkDropListData 等錯誤
    CommonModule], // <-- 必須加在這裡，HTML 才能辨認 | keyvalue ],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})


export class IndexComponent implements OnInit {
  constructor(private http: HttpClient) { }

  readonly dialog = inject(MatDialog);









  username: string = 'Guest';
  deckList: any[] = [];
  selected_deck_id: number = 0;
  selected_deck_name: string = 'default';

  selected_deck_defaulted: boolean = false;/////只有一開始初始化 會用到

  email !: string;
  // 牌組資料 (對應原 p4, p5, p8)
  mainDeck: any[] = [];
  sideDeck: any[] = [];
  fusionDeck: any[] = [];
  // new_main_deck: any[] = [];
  // new_side_deck: any[] = [];
  // new_extra_deck: any[] = [];
  /////編輯中的沒動過的牌組資料 for dialog問她要不要保存用的 cancel舊回退feedold給她.
  old_mainDeck: any[] = [];
  old_sideDeck: any[] = [];
  old_fusionDeck: any[] = [];

  // 卡池資料 (對應原 p10, p11)
  cardPool: any[] = [];
  filtered_card_pool: any[] = [];
  first_load: boolean = true;

  userDecks: any[] = [];

  rename_boolean: boolean = false; ////////true才是修改中名稱
  editing_name: string = "";
  hover_pic: string = "";///左上角
  hover_text: string = "";

  nickname: string = "";



  hover_card_name: string = '';
  hover_card_type: string = '';
  hover_sub_type: string = '';
  hover_card_code: string = '';
  hover_card_tier: string = '';

  hover_race_lv!: number;
  hover_attribute: string = '';
  hover_race: string = '';
  hover_race_atk!: number;
  hover_race_def!: number;

  hover_card_cn_name: string = '';
  hover_card_cn_text: string = '';

  hover_tier!: number;

  language = "en";

  // 追蹤目前卡片是否在任何一個籃子上方
  isOverContainer = false;


  displayLimit: number = 50;

  my_test_deck: string[] = ['Deck 1', 'Deck 2', 'Deck 3', 'Deck 4', 'Deck 5', 'Deck 6', 'Deck 7', 'Deck 8'];
  my_decks: string[] = [];
selector_on:boolean=false;// 控制選單展開與收合
current_deck:string="";

rename_boolean_boolean: boolean = false; ////////true才是修改中名稱
new_entered_name:string="";

open_selector() {
    this.selector_on = !this.selector_on;
  }

  select_select_deck(deck: string, event: Event) {
    event.stopPropagation(); // 避免點擊時立刻被外層關閉
    this.current_deck = deck;
    this.selector_on = false;


    // 1. 從 localStorage 讀取該牌組的資料
    const rawData = localStorage.getItem(this.current_deck);

    if (rawData) {
      try {
        // 2. 解析 JSON 並將內容 assign 給對應的變數
        const loadedDeck = JSON.parse(rawData);

        this.mainDeck = loadedDeck.main_deck || [];
        this.sideDeck = loadedDeck.side_deck || [];
        this.fusionDeck = loadedDeck.fusion_deck || []; // 或者如果是 extra_deck 依你的命名為主

        console.log(`成功載入牌組：${this.current_deck}`, loadedDeck);
      } catch (e) {
        console.error('解析牌組資料失敗', e);
      }
    } else {
      // 如果 localStorage 裡找不到（防呆），給空陣列
      this.mainDeck = [];
      this.sideDeck = [];
      this.fusionDeck = [];
    }
       this.refresh_main_deck();
  }



  load_my_decks(){
this.my_decks = []; // 每次載入前先清空，避免重複疊加

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // 如果你的 localStorage 裡面還存了其他東西（例如登入 token），
        // 可以在這邊加上過濾條件，例如：if (key.includes('deck')) { ... }
        this.my_decks.push(key);
      }
    }
  }

new_new_deck(){
// 1. 動態產生新牌組名稱 (例如用 localStorage 數量 + 1，或自訂命名規則)
  // 為了避免命名衝突，建議加個前綴，例如 "deck_"
  const newDeckName = `newdeck_${localStorage.length + 1}`;

  // 2. 設定當前牌組名稱
  this.current_deck = newDeckName;
  this.selector_on = false; // 關閉選單（如果有這功能的話）

  // 3. 清空畫面的牌組變數
  this.mainDeck = [];
  this.sideDeck = [];
  this.fusionDeck = [];

  // 4. (選用) 直接把這個空牌組寫入 localStorage，幫它佔位初始化
  const emptyDeckData = {
    main_deck: [],
    side_deck: [],
    fusion_deck: []
  };
  localStorage.setItem(this.current_deck, JSON.stringify(emptyDeckData));

  // 3. 【最關鍵】把新名字推進你的牌組清單陣列中！
  this.my_decks.push(newDeckName);

  // // 4. 【確保同步】如果有把清單存回 localStorage 的習慣，這裡也要更新
  // localStorage.setItem('my_decks', JSON.stringify(this.my_decks));

  // 5. 這時候清單已經有新名字了，再切換過去
  this.select_select_deck(newDeckName, new Event('click'));

  console.log('當前可用牌組清單：', this.my_decks);
  console.log(`已建立並切換至新牌組：${this.current_deck}`);
}

copy_copy_deck() {
  if (!this.current_deck) {
    console.warn('目前沒有選中的牌組可以複製');
    return;
  }

  // 1. 決定新牌組的名字（例如：原名_copy，如果重複可以加上時間戳或流水號）
  const newDeckName = `${this.current_deck}_copy`;

  // 2. 準備要複製的資料包（使用 JSON.parse(JSON.stringify(...)) 確保是深拷貝，避免雙向汙染）
  const copiedData = {
    main_deck: JSON.parse(JSON.stringify(this.mainDeck)),
    side_deck: JSON.parse(JSON.stringify(this.sideDeck)),
    fusion_deck: JSON.parse(JSON.stringify(this.fusionDeck))
  };

  // 3. 寫入 localStorage 建立這副新複製品
  localStorage.setItem(newDeckName, JSON.stringify(copiedData));

  // 3. 【最關鍵】把新名字推進你的牌組清單陣列中！
  this.my_decks.push(newDeckName);

  // 4. 直接切換到這副新複製的牌組上（如果你的下拉選單列表是動態抓 localStorage 的話，這裡也可以順便重新整理選單）
  this.select_select_deck(newDeckName, new Event('click'));

  console.log(`已成功複製牌組：${this.current_deck} -> ${newDeckName}`);
}
delete_delete_deck() {
  if (!this.current_deck) {
    console.warn('目前沒有選中任何牌組可刪除');
    return;
  }

  // 1. 從 localStorage 徹底刪除這副牌組
  localStorage.removeItem(this.current_deck);

  console.log(`已刪除牌組：${this.current_deck}`);

  // 2. 清空當前畫面的資料與牌組名稱
  this.current_deck = ''; // 或者顯示「未選擇牌組」
  this.mainDeck = [];
  this.sideDeck = [];
  this.fusionDeck = [];


  // 3. 重新整理畫面上的 6 個切分區塊（讓畫面變空白）
  this.refresh_main_deck();

   this.load_my_decks();
}

rename_rename(newName: string){

  if (!this.current_deck || !newName.trim()) return;

  const trimmedNewName = newName.trim();
  if (trimmedNewName === this.current_deck) return;

  // 1. 取得舊牌組的內容   current_deck 是牌組name 也是key in local storatge
  const deckData = localStorage.getItem(this.current_deck);

  if (deckData) {
    // 2. 直接寫入新名稱（如果 localStorage 已經有這個名字，會直接被覆蓋）
    localStorage.setItem(trimmedNewName, deckData);

    // 3. 移除舊的牌組 Key
    localStorage.removeItem(this.current_deck);

   // 1. 【關鍵】在改變 this.current_deck 之前，先用變數把舊名字存起來！
  const oldName = this.current_deck;

    // 4. 更新當前牌組名稱
    this.current_deck = trimmedNewName;

    // 5. 【清單同步】移除舊名字、加入新名字
    // 假設你的下拉選單清單是存在 this.my_decks 陣列中：
    this.my_decks = this.my_decks.map(name => name === oldName ? trimmedNewName : name);

    // 或者如果你是習慣用 filter + push 的方式也可以：
    // this.my_decks = this.my_decks.filter(name => name !== oldName);
    // this.my_decks.push(trimmedNewName);

    console.log(`牌組已成功從 ${oldName} 更名為：${trimmedNewName}`);

    console.log(`牌組已重新命名/覆蓋為：${trimmedNewName}`);

}
}

export_deck(){}



  //以上網頁版方法

  filter: CardFilter = {
    name: '',
    description: '',
    card_type: '',
    sub_type: '',
    race: '',
    attribute: '',
    levelMin: null,   // 現在可以放 null 了
    levelMax: null,   // UI 會顯示空白，呈現漂亮的 placeholder
    atkMin: null,
    atkMax: null,
    defMin: null,
    defMax: null,
    tierMin: null,
    tierMax: null,

    cn_name: '',
    cn_text: ''
  };

  old_deck_name_backup: string = "";

  snap_shot: any;
isDeleting = false; // 新增這行

  //for suck cdk
  // 2. UI 渲染用的 6 個分身容器
  sections: any[][] = [[], [], [], [], [], []];

  // 3. 讓所有容器連動的 ID 清單
  allListIds = ['list-0', 'list-1', 'list-2', 'list-3', 'list-4', 'list-5'];




  @ViewChild('rename') rename!: ElementRef;

  private token: string | null = null;
  private httpOptions: any;

  // 紀錄目前的排序模式：'default' 或 'random'
  sortMode: 'default' | 'random' = 'default';
  // 用來存放隨機後的結果，避免 Getter 每次都重新洗牌
  randomizedResult: any[] = [];

  more_boo: boolean = false;

  more() {
    this.more_boo = true;

  }






  ngOnInit() {
    this.email = localStorage.getItem('email') ?? '';
    this.token = localStorage.getItem('token');
    this.nickname = localStorage.getItem('nickname') ?? '';

    // 明確指定 headers 類型
    this.httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      })
    };
    //

    // ❌ 不要在這裡加 observe: 'events' 或 reportProgress: true
    // 取得登入資訊 (取代 JSP 頂部 session 檢查) [cite: 3]
    this.username = localStorage.getItem('username') || 'Guest';
    this.loadCardPool();
    this.loadDeckList();

    ///以上有維護select deck id 問題是api非同步

this.load_my_decks();///offline版本的my_decks
  }

  // 將總資料切分成 6 份
  refresh_main_deck() {
    //   console.log(this.mainDeck);

    //   // 1. 先清空原本的 Sections，避免殘留
    // this.sections = [[], [], [], [], [], []];

    // // 2. 依照 10 個一組，把 mainDeck 的物件分發出去
    // for (let i = 0; i < 6; i++) {
    //   const start = i * 10;
    //   const end = start + 10;
    //   // slice 會回傳一個新陣列，裡面裝著物件的引用
    //   this.sections[i] = this.mainDeck.slice(start, end);
    // }

    //   const temp = [...this.mainDeck];
    //   for (let i = 0; i < 6; i++) {
    //     this.sections[i] = temp.slice(i * 10, (i + 1) * 10);
    //   }
    //    console.log("ㄚㄚ");
    //       console.log(this.sections[1]);

    //           console.log(this.sections[2]);

    console.log('當前 mainDeck 長度:', this.mainDeck.length);
    console.log('內容:', this.mainDeck);

    if (this.mainDeck.length === 0) {
      console.warn('警告：mainDeck 是空的，所以 Sections 也是空的');
    }

    // 簡化後的邏輯
    this.sections = [[], [], [], [], [], []];
    for (let i = 0; i < 6; i++) {
      this.sections[i] = this.mainDeck.slice(i * 10, (i + 1) * 10);
    }

    console.log("第二行內容:", this.sections[1]);
  }




  // 效能優化用
  trackByCardId(index: number, card: any) {
    return card.id;
  }

  // 用下面的drop
  // drop(event: CdkDragDrop<any[]>) {
  //     if (event.previousContainer === event.container) {
  //       moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  //     } else {
  //       transferArrayItem(
  //         event.previousContainer.data,
  //         event.container.data,
  //         event.previousIndex,
  //         event.currentIndex
  //       );
  //     }

  //     // 關鍵：每次移動完，立刻「合併再重切」
  //     this.mainDeck = [
  //       ...this.sections[0], ...this.sections[1], ...this.sections[2],
  //       ...this.sections[3], ...this.sections[4], ...this.sections[5]
  //     ];

  //     // 重新平衡，確保每排又是 10 張，且卡片會「自動回彈補位」
  //     this.refresh_main_deck();
  //   }














  // --- 資料載入邏輯 ---
  loadCardPool() {
    // 2. 必須這樣包裝：{ headers: new HttpHeaders({ ... }) }


    // 這裡未來對接 Spring Boot 的Cardpool API
    const filterOptions = {
      flag_return_all_info: true,  // 告訴後端我要完整的卡片資料
      flag_sort_by_tier: true,     // 按分數高低排序
      // 其他過濾條件如果不傳，後端會預設為 NULL，也就是抓全卡池
    };

    // 1. 強制指定這個物件的類型，防止 TS 亂猜
    //   const httpOptions: any = {
    //     headers: new HttpHeaders({
    //       'Authorization': `Bearer ${this.token}`
    //     })
    //   };



// 直接像網頁抓檔案一樣抓取根目錄下的 json
    this.http.get<any[]>('pool_json.json').subscribe({
      next: (data) => {
        this.cardPool = data;
        console.log('成功讀取根目錄 JSON！', this.cardPool);
      },
      error: (err) => {
        console.error('讀取失敗，請檢查檔案是否在 public 資料夾內', err);
      }
    });
  }







  ////主要排序作用的
  usual_sort(array: any[], is_main_deck?: boolean) {
    // array有可能是卡持的物件arry 或maindeck的cardcode array....

    if (is_main_deck) {
      array = array.map(code => {
        return this.cardPool.find(c => c.passcode === code) || { passcode: code };
      });
    }




    // sort for 顯示
    const typePriority: any = { 'monster': 1, 'magic': 2, 'trap': 3 };

    // 2. 定義屬性優先度 (光 > 暗 > 地 > 水 > 火 > 風)
    const attrPriority: any = { 'light': 1, 'dark': 2, 'earth': 3, 'water': 4, 'fire': 5, 'wind': 6 };

    // 3. 子類/框架排序：通常 > 效果 > 融合 > 儀式 > 同步 > 超量 > 連結
    // 魔法部分：通常 > 永續 > 裝備 > 速攻 > 場地 > 儀式
    const subPriority: { [key: string]: number } = {
      'normal': 1,
      'effect': 2,
      'fusion': 3,
      'ritual': 6,
      'continuous': 4, 'quick-Play': 2, 'equip': 3, 'field': 5 // 魔法子類優先序
    };

    array.sort((a, b) => {


      // --- 第一層：大類 (Monster > Magic > Trap) ---
      const typeA = typePriority[a.card_type] || 99;
      const typeB = typePriority[b.card_type] || 99;
      if (typeA !== typeB) return typeA - typeB;



      // --- 第二層：子類 (到這裡代表 type 已經一樣了) ---
      const subA = subPriority[a.sub_type] || 99;
      const subB = subPriority[b.sub_type] || 99;
      if (subA !== subB) return subA - subB;

      // --- 第三層：等級 (降序) ---
      const lvA = b.level || 0;
      const lvB = a.level || 0;
      if (lvA !== lvB) return lvA - lvB;

      // --- 第四層：攻擊力 (降序) ---
      (b.atk || 0) - (a.atk || 0);

      // --- 第五層：def (降序) ---
      (b.atk || 0) - (a.atk || 0);

      // --- 屬性排序 (到這裡代表atk def一樣，開始比屬性) ---
      const attrA = attrPriority[a.attribute?.toLowerCase()] || 99; // 使用 ?.toLowerCase() 確保字串匹配
      const attrB = attrPriority[b.attribute?.toLowerCase()] || 99;

      // 最後一層可以不用寫 if，直接 return 比較結果
      return attrA - attrB;

      ///之後再比種族啥的 沒必要ok.
    });


    // 3. 【關鍵】暴力更新 Reference
    // 如果傳進來的是 mainDeck，我們就用新陣列替換掉它，觸發 Angular 渲染
    // if (array=== this.mainDeck) {
    //     this.mainDeck = [...array];
    //     console.log("aaaa");
    //    result= this.mainDeck;

    // }

    // if(return_result){console.log(this.mainDeck);  return array; }
    // else {console.log("我在哪"); return array;}

    // 87的cdk害我
    //
    // if(is_main_deck){ console.log("我在哪"); this.mainDeck = [...array]; return this.mainDeck;}
    if (is_main_deck) {
      console.log("我在哪");
      // 4. 【還原】排序完後，再轉回 cardCode 陣列
      array = array.map(card => card.passcode);
      console.log("強制重新渲染完成 機指定回傳 thismaindeck=array");
      console.log(array);
      ///因為她是分成div
      this.mainDeck = array;
      this.refresh_main_deck();
      return this.mainDeck;


    }


    return array;
  }






  ///渲染 要使用的cardpool和 filter
  get filteredPool() {

    //用打亂過的cardpool 去filter 不排序
    if (this.sortMode === 'random') {
      let a = this.do_filt(this.randomizedResult || []);

      return a;
    }
    ///用正常的cardpool filter並排序
    else {
      let a = this.do_filt(this.cardPool);
      return this.usual_sort(a);
    }

  }

  // forskin 自訂卡圖
  get_skin_card(card?: any, cardcode?: string): string {


    // 從你原本存全部資料的陣列裡找這張卡
    const cardd = this.cardPool.find(c => c.passcode === cardcode);
    if (card == null) { card = cardd; }

    if (card) {
      if (card.fixed_img_path != null) {
        // 把card.fixed_img_path 拼接到 img然後return
        // ✅ 使用反引號拼接變數
        return `/skin/${card.fixed_img_path}.jpg`;
      }
      if (card.fixed_img_path == null) {
        // 把card.fixed_img_path 拼接到 img然後return
        // ✅ 使用一般的字串拼接也可以，但不要把變數也包進引號裡
        return '/pics/' + card.passcode + '.jpg';
      }
    }






    if (cardcode) {
      // 從你原本存全部資料的陣列裡找這張卡
      const card = this.cardPool.find(c => c.passcode === cardcode);

      if (card.fixed_img_path != null) {
        // 把card.fixed_img_path 拼接到 img然後return
        return " '/skin/' + card.fixed_img_path +'.jpg'  ";
      }
      return " '/pics/'+  card.passcode+'.jpg'  ";
    }


    return "";

  }






  do_filt(array: any[]) {
    // --- A. 先準備好「搜尋關鍵字」(來自 filter 輸入框) ---
    const nameQuery = (this.filter.name || '').toLowerCase();
    const descQuery = (this.filter.description || '').toLowerCase();



    const result = array.filter(card => {
      // 1. 名稱搜尋 (包含空值處理)
      const matchName = (
        (card.name || '')
      ).toLowerCase().includes(nameQuery);;

      const match_cn_name = (card.cn_name || '').toLowerCase().includes(nameQuery);;

      const matchDescription = (
        (card.description || '')
      ).toLowerCase().includes(descQuery);
      const match_cn_text = (card.cn_text || '').toLowerCase().includes(descQuery);;


      // const matchName = card.name.toLowerCase().includes(filterName);
      // const matchDescription = card.description.toLowerCase().includes(filterDescription);

      // 2. 卡片種類 (monster, magic, trap)
      const matchType = !this.filter.card_type || card.card_type === this.filter.card_type;
      //「如果使用者根本沒打算濾這個項目（沒填），那就直接讓這張卡過關；否則，這張卡的屬性必須完全符合使用者選的那個值。」
      // 3. 屬性 (attribute)
      const matchAttribute = !this.filter.attribute || card.attribute === this.filter.attribute;

      // 4. 種族 (race)
      const matchRace = !this.filter.race || card.race === this.filter.race;








      // --- 在 .filter() 內部 ---

      // 1. 取得卡片的「共通名字」 (不改動原始資料)
      let cardBaseType = card.sub_type;
      if (cardBaseType === 'normal_spell' || cardBaseType === 'normal_trap') {
        cardBaseType = 'normal';
      }
      if (cardBaseType === 'continuous_spell' || cardBaseType === 'continuous_trap') {
        cardBaseType = 'continuous';
      }

      // 2. 取得過濾條件的「共通名字」 (不改動全域 filter) 魔法陷阱的 json名稱suck some sql..定義問題etc nvm kk
      let filterBaseType = this.filter.sub_type;
      if (filterBaseType === 'normal_spell' || filterBaseType === 'normal_trap') {
        filterBaseType = 'normal';
      }
      if (filterBaseType === 'continuous_spell' || filterBaseType === 'continuous_trap') {
        filterBaseType = 'continuous';
      }

      // 3. 拿這兩個「共通名字」來比對
      const matchSubType = !this.filter.sub_type || cardBaseType === filterBaseType;

      // // 【數字類】沒輸入時，我們假設它永遠符合條件
      // // 如果 filter.atkMin 是 null，代表使用者不想濾攻擊力，那就直接給 true
      const temp_atkMin = this.filter.atkMin ?? -100;
      const temp_atkMax = this.filter.atkMax ?? 10000;
      const temp_defMin = this.filter.defMin ?? -100;
      const temp_defMax = this.filter.defMax ?? 10000;
      const temp_tierMin = this.filter.tierMin ?? 0;
      const temp_tierMax = this.filter.tierMax ?? 104;
      const temp_levelMin = this.filter.levelMin ?? 0;
      const temp_levelMax = this.filter.levelMax ?? 12;

      const matchAtk =
        (card.atk >= temp_atkMin && card.atk <= temp_atkMax);

      const matchDef =
        (card.def >= temp_defMin && card.def <= temp_defMax);

      // Tier 通常一定會有預設值 0~5，所以直接比就好
      const matchTier = card.tier >= temp_tierMin && card.tier <= temp_tierMax;

      const matchLevel = card.level >= temp_levelMin && card.level <= temp_levelMax;

      // 回傳所有條件的交集
      return (matchName || match_cn_name) && (matchDescription || match_cn_text) && matchType && matchAttribute && matchRace && matchSubType && matchTier && matchAtk && matchDef && matchLevel;
    });
    ////////根據filter後 result sort在return to filteredpool
    return result;
  }


  clearFilters() {
    //    this.filter = {
    //   name: '',
    //   description: '',
    //   card_type: '',
    //   sub_type: '',
    //   race: '',
    //   attribute: '',
    //   levelMin:1,
    //   levelMax: 12,
    //   atkMin: -10,
    //   atkMax: 10000, // 設為一個夠大的數值，確保初始能看到所有卡 總之這邊就是跟最上面初始化 依樣 清空     顯示all
    //   defMin: -10,
    //   defMax: 10000,
    //   tierMin: 0,
    //   tierMax: 104
    // };
    this.filter = {

      name: '',
      description: '',
      card_type: '',
      sub_type: '',
      race: '',
      attribute: '',
      levelMin: null,   // 現在可以放 null 了
      levelMax: null,   // UI 會顯示空白，呈現漂亮的 placeholder
      atkMin: null,
      atkMax: null,
      defMin: null,
      defMax: null,
      tierMin: null,
      tierMax: null,
      cn_name: '',
      cn_text: ''
    };






  }
  // --- 核心邏輯：計算總 Tier 分數 (Ace Format 規則)  ---
  get totalTier(): number {
    return this.mainDeck.reduce((sum, card) => sum + (card.tier || 0), 0);
  }
  onScroll(event: any) {
    const element = event.target;
    // 檢查是否滑到底部 (當前滾動位置 + 容器高度 >= 內容總高度)
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 1) {
      this.loadMore();
    }
  }
  loadMore() {
    this.displayLimit += 50; // 每次增加 50 張 scroll 卡池
  }
  hover(temp: boolean, cardCode: string) {






// const card = this.cardPool.find(c => String(c.passcode) === String(cardCode));
    // 從你原本存全部資料的陣列裡找這張卡
    const card = this.cardPool.find(c => c.passcode === cardCode);
    if (card) {
      console.log('找到的卡片物件:', card);
      this.hover_text = card.description;





      this.hover_card_code = cardCode;
      this.hover_pic = '/pics/' + cardCode;
      if (card.fixed_img_path != null) {
        this.hover_pic = '/skin/' + card.fixed_img_path;
        // for pic路徑
        // console.log(this.hover_pic );
      }



      this.hover_card_name = card.name;
          this.hover_card_type = card.card_type;
this.hover_sub_type = card.sub_type; // 萬一對不到就先放原值
this.hover_card_tier = card.tier; // 萬一對不到就先放原值








      this.hover_race_lv = card.level;
      this.hover_attribute = card.attribute;
      this.hover_race = card.race;
      this.hover_race_atk = card.atk;
      this.hover_race_def = card.def;

      this.hover_card_cn_name = card.cn_name;
      this.hover_card_cn_text = card.cn_text;
    }



  }

  hover_on_pool(temp: boolean, card: any) {

    this.hover_pic = '/pics/' + card.passcode;

    if (card.fixed_img_path != null) {
      this.hover_pic = '/skin/' + card.fixed_img_path;
      // for pic路徑
      // console.log(this.hover_pic );
    }

    this.hover_text = card.description;

    this.hover_card_name = card.name;
    this.hover_card_type = card.card_type;
    this.hover_sub_type = card.sub_type;
this.hover_card_tier = card.tier; // 萬一對不到就先放原值

    this.hover_race_lv = card.level;
    this.hover_attribute = card.attribute;
    this.hover_race = card.race;
    this.hover_race_atk = card.atk;
    this.hover_race_def = card.def;

    this.hover_card_cn_name = card.cn_name;
    this.hover_card_cn_text = card.cn_text;
  }
  on_card_type_change() {
    //維護filter
    this.filter.sub_type = ''

    const type = this.filter.card_type;
    // 1. 如果不是怪獸，清空所有怪獸專屬欄位
    if (type !== 'monster') {
      this.filter.race = '';
      this.filter.sub_type = '';
      this.filter.attribute = '';
      this.filter.levelMin = null;
      this.filter.levelMax = null;
      this.filter.atkMin = null;
      this.filter.atkMax = null;
      this.filter.defMin = null;
      this.filter.defMax = null;
      // 如果你有設定特定的子類型（如：調整、靈擺），也可以在這裡清空
    }

    if (type !== 'magic') {
      this.filter.sub_type = '';
      // 如果你有設定特定的子類型（如：調整、靈擺），也可以在這裡清空
    }

    // 2. 如果是陷阱卡，可能要清空某些只有魔法卡有的屬性（假設你有分的話）
    // if (type === 'trap') { ... }
    if (type !== 'trap') {
      this.filter.sub_type = '';
      // 如果你有設定特定的子類型（如：調整、靈擺），也可以在這裡清空
    }





  }


  ///////相當於是每次做完事情都刷新所有 並且前端渲染的也都是.
  loadDeckList() {
    // 這裡未來對接 Spring Boot 的 DeckList API
    console.log('載入使用者的牌組清單...');
    this.deckList = [];

    this.http.post<any>('http://localhost:8080/api/deck_editor/deck_list', {}, this.httpOptions)
      .subscribe({

        next: (data: any) => {
          console.log('API 認證成功，資料已載入');
          this.userDecks = data.decks; // 這裡就會存入你的 [ {id:101...}, {id:102...} ]
          // this.user_deck_name = data.decks; // 這裡就會存入你的 [ {id:101...}, {id:102...} ]
          console.log('API 認證成功，decklist資料已載入');
          console.log(data);




          if (this.first_load == true) {
            // 遍歷 (Traversal) 找出 defaulted 為 true 的元素
            const defaultDeck = this.userDecks.find(d => d.defaulted === true);
            if (defaultDeck) {
              this.selected_deck_id = defaultDeck.id; // 這會讓 select 自動跳到那一項
              this.selected_deck_name = defaultDeck.deck_name;



              this.selected_deck_defaulted = defaultDeck.defaulted;

              this.first_load = false;
            }



            console.log(this.selected_deck_id);
            // 呼叫 API 載入預設卡組 卡片內容
            this.http.get<any>(`http://localhost:8080/api/deck_editor/load_deck_card?deckId=${this.selected_deck_id}`)
              .subscribe({
                next: (res: any) => {
                  // 把抓回來的卡片塞進你原本畫面上顯示的陣led
                  this.mainDeck = res.main_deck;
                  this.fusionDeck = res.extra_deck;
                  this.sideDeck = res.side_deck;


                  console.log('牌組載入成功 預設牌組！', res);
                  this.refresh_main_deck(); //重要ok




                  //  >>>>為了維護使用者編輯 取消後可還原名子 的比較快照
                  this.snap_shot = JSON.stringify({
                    name: this.selected_deck_name,
                    main: this.mainDeck,
                    fusion: this.fusionDeck,
                    side: this.sideDeck
                  });
                  console.log(this.snap_shot);
                  console.log("討厭");
                }
              });





          } ///成功的時候 第一次在入夜面 選到defaultdeck



          ///另外 日常維護:
          // 檢查目前選中的 ID 是否還存在於新的清單中


          const stillExists = this.userDecks.some(d => d.id === this.selected_deck_id);

          if (this.userDecks.length > 0) {
            // 如果原本選的 ID 不見了（被刪了）或者目前是 0
            if (!stillExists || this.selected_deck_id === 0) {
              const first = this.userDecks[0];
              this.selected_deck_id = first.id;
              this.selected_deck_name = first.deck_name;

              // 選中後，記得叫它去載入卡片  ///一開始

              this.selectDeck();
            }
          } else {
            // 真的半副牌都沒有的情況

          }

          this.refresh_main_deck();////for cdk..

        },
        error: (err) => {
          // 如果 Token 為空，這裡就會抓到 500 錯誤
          console.error('API decklist還是被擋： 登入逾時或無權限，請重新登入 ', err);
        }
      });



  }










  // --- 操作函式 (對應原 p2 按鈕與右鍵選單) [cite: 4, 6] ---
  addToDeck(card: any) {
    // 1. 判斷是否為額外怪獸 (例如 Fusion, Synchro, Xyz, Link)
    // 這裡假設你的資料欄位是 card.subtype
    if (card.sub_type && card.sub_type.toLowerCase().includes('fusion')) {
      if (this.reach_limit(card.passcode, this.fusionDeck)) { return; }

      // 檢查額外牌組上限 (通常是 15 張)
      if (this.fusionDeck.length < 15) {
        this.fusionDeck.push(card.passcode);
        console.log('已加入 Extra Deck:', card.name);
      } else {
        // alert('Extra Deck 已滿！');
      }

    } else {
      // 2. 一般卡片加入 Main Deck
      if (this.mainDeck.length < 60) {
        if (this.reach_limit(card.passcode, this.mainDeck)) { return; }
        this.mainDeck.push(card.passcode);
        console.log('已加入 Main Deck:', card.name);
      } else {
        // alert('Main Deck 已滿！');
      }

    }

    this.refresh_main_deck();

  }

  add_to_side_deck(event: MouseEvent, card: any) {
    event.preventDefault();

    if (this.reach_limit(card.passcode, this.sideDeck)) { return; }

    // 🛑 就是這一行！沒寫這行，右鍵選單就會噴出來


    // 剩下的才是你的邏輯
    if (this.sideDeck.length < 15) {
      this.sideDeck.push(card.passcode);
    }
  }




  remove_from_main_deck(index: number) {
    this.mainDeck.splice(index, 1);
    this.refresh_main_deck();
  }
  remove_from_extra_deck(index: number) {
    this.fusionDeck.splice(index, 1);

  }
  remove_from_side_deck(index: number) {
    this.sideDeck.splice(index, 1);
    ///.splice 會自動把後面的元素往前遞補
  }

  async selectDeck(event?: any) {



  // 2. 獲取目前old真正的 ID（還沒被改掉的）
  const currentId = this.selected_deck_id;






    ////先問 偵測是否原本有變化還沒儲存 dialog  那邊一定會較她儲存或捨棄   並別讓她切換牌組
    // 2. 呼叫 warn 並「等待」玩家選完

    // if (this.is_changed()&&!this.isDeleting) {
    //   const shouldStop = await this.warn();

    //   if (shouldStop) {
    //     console.log('玩家選了返回編輯，selectDeck 在這裡中斷，不往下執行');
    //     // 【重點！】強制把 HTML 元素的值撥回原本的 ID
    //   // 因為你點選的那一刻，HTML 已經轉到 nextId 了
    //   // 我們必須手動把它設定回原本的 ID，畫面才會跳回去
    //   event.target.value = currentId;
    //     return; // 直接 return，後面的代碼就不會跑了
    //   }
    //   // 3. 玩家選了捨棄 (false)，執行還原
    //   console.log('玩家選了捨棄，準備前往下一副');

    // }




    // this.warn(); 那如果我直接再她切換牌組跳出dialog看她要返回 還是直接前往..  (根據選擇 決定是true false決定作不同事情
    ///warn選完選項才重新呼叫執行selectdeck

// 4. 【手動給值】玩家確定要換，或者沒變動，這時才更新變數
        // 從 event 拿到選單「當前被選中」的值，但這還沒存進你的 selected_deck_id

// 1. 從「通知單 ($event)」裡抓出玩家點選的新 ID
  const nextId = Number(event.target.value);



// 2. 【核心修正】先更新變數 ID，再發請求
  console.log('準備切換到新 ID:', nextId);
  this.selected_deck_id = nextId; // 👈 這一行沒寫，後面全錯






    // 呼叫 API 載入卡片內容
    this.http.get<any>(`http://localhost:8080/api/deck_editor/load_deck_card?deckId=${this.selected_deck_id}`)
      .subscribe({
        next: (res: any) => {
          // 把抓回來的卡片塞進你原本畫面上顯示的陣led
          this.mainDeck = res.main_deck;
          this.fusionDeck = res.extra_deck;
          this.sideDeck = res.side_deck;
          //  this.old_mainDeck = [...res.main_deck]; // 建立另一個獨立的新陣列
          //           this.old_fusionDeck= [...res.extra_deck];
          //           this.old_sideDeck= [...res.side_deck];
          // this.old_deck_name_backup=res ///名稱快照只有再改名才需要 拿selected_deck_name ok
          console.log('牌組載入成功！', res);


          // 2. 如果是選擇舊牌組，從 userDecks 陣列中尋找對應的物件
          const foundDeck = this.userDecks.find(d => d.id === this.selected_deck_id);

          if (foundDeck) {
            // 同步更新這些變數，這樣你 Save 的時候才會拿到正確的值
            this.selected_deck_id = foundDeck.id;
            this.selected_deck_name = foundDeck.deck_name;
            // this.old_deck_name_backup= foundDeck.deck_name;  ///只是為了維護 編輯名稱etc
            this.selected_deck_defaulted = foundDeck.defaulted;
            console.log('當前選aAaaaaaaaaaaa中的 name:', foundDeck.deck_name);
            // 順便把卡片清單也塞進去 (如果你之後要渲染卡片的話)
            // this.mainDeck = foundDeck.main_cards;
          }


          this.refresh_main_deck();



          // res選完後 還要維護快照:
                  this.snap_shot = JSON.stringify({
                    name: this.selected_deck_name,
                    main: this.mainDeck,
                    fusion: this.fusionDeck,
                    side: this.sideDeck
                  });
        }
      });


  }






  // ///離開或選牌組前先呼叫 如果是 changed 舊呼叫warn:
  is_changed(): boolean {
    // 把現在的狀態也轉成字串
    const currentStatus = JSON.stringify({
      name: this.selected_deck_name,
      main: this.mainDeck,
      fusion: this.fusionDeck,
      side: this.sideDeck
    });

    // 直接比對兩個字串是否完全一致
    const changed = currentStatus !== this.snap_shot;

    console.log("是否有變動？", changed);
    return changed;
  }



  ///改名或變動玩不儲存 dialog問她

  ///沒儲存     想做其他操作或離開/  先呼叫warn
  // 這就是你說的那行宣告！它會立刻彈出視窗





  // warn(): Promise<boolean> {
  //   // 1. 先建立 Dialog



  //   const dialogRef = this.dialog.open(DialogInformComponent, {
  //   width: '400px',
  //   disableClose: true, // 👈 加上這行，點空白處就不會關閉了
  //   data: {
  //     title: "warn",
  //   }
  // });

  // return new Promise((resolve) => {
  //   dialogRef.afterClosed().subscribe(result => {
  //     resolve(result);
  //   });
  // });

  // }





  //     // 3. 監聽視窗關閉後的結果
  //     dialogRef.afterClosed().subscribe(result => {
  //       console.log('玩家的選擇是:', result);
  //       if (result === 'save') {
  //         this.saveData(); // 呼叫原本頁面的儲存方法
  //       } else if (result === 'discard') {
  //         this.goBackToMenu(); // 直接離開
  //       }
  //     });


  ///只有再dialog觸發但怎偵測變更
  cancel_edit() {
    //根本不用還原 舊是讓他直接執行其他操作.

    // const targetDeck = this.userDecks.find(deck => deck.id === this.selected_deck_id);
    // if (targetDeck) {
    //   targetDeck.deck_name = this.old_deck_name_backup; // 用備份還原陣列
    //   this.selected_deck_name = this.old_deck_name_backup; // 還原顯示

    //   this.mainDeck=[...this.old_mainDeck]; ///asign回去..
    //     this.fusionDeck=[...this.old_fusionDeck];
    //       this.sideDeck=[...this.old_sideDeck];
    // }


  }







  save_deck(deck_id: number, deck_name: string, email: string, defaulted: boolean, main_deck: any[], extra_deck: any[], side_deck: any[]) {
    // 呼叫 Spring Boot 的 SaveDeck [cite: 1, 2]
    console.log('儲存目前的牌組配置');

    if (this.isGuest()) {
      // this.showGuestWarning();
      console.log('你是訪客 無撒save deck');

//       this.dialog.open(DialogInformComponent, {
//   width: '400px',
//   disableClose: true, // 👈 加上這行，點空白處就不會關閉了
//   data: {
//     title: 'guest',
//     content: '訪客無法創建/編輯/命名牌組 ',

//   }
// });

      return; // 關鍵：攔截，不讓後面的代碼跑
    }


    const temp_saved_name = deck_name;////為了newdeck用的

// 將 main_deck 陣列轉換成 JSON 字串，並以 current_deck 變數的值作為 Key 存入
// 因此，JSON.stringify() 的作用就是擔任「翻譯官」：

// 存進去時：用 JSON.stringify() 把複雜的陣列或物件打包成一段「長得像文字的 JSON 字串」。

// 拿出來時：用 JSON.parse() 把那段字串重新解開，還原成你原本熟悉的 JavaScript 陣列或物件，才能繼續跑迴圈或操作畫面。
 // 1. 把所有想存的東西包成一個物件
  const to_save_deck = {
    main_deck: this.mainDeck,
    side_deck: this.sideDeck,
    fusion_deck: this.fusionDeck
  };

  // 2. 用 JSON.stringify() 把整包物件轉成字串，並用 current_deck 當作 Key 存入
  localStorage.setItem(this.current_deck, JSON.stringify(to_save_deck));
  console.log(`已成功儲存牌組: ${this.current_deck}`);


  }


  set_as_default_deck() {
    if (!this.selected_deck_id) return;

    const url = `http://localhost:8080/api/deck_editor/set_as_default_deck?deckId=${this.selected_deck_id}`;

    this.http.post(url, {}, this.httpOptions).subscribe({
      next: () => {
        console.error('預設牌組成功');

        // 重要：更新前端狀態，讓按鈕立刻變色/禁用
        // this.selected_deck_defaulted = true;

        // 選擇性：重新抓取清單，確保 userDecks 裡的資料也是最新的   ***刷新 +顯示預設+  selected deckid維護 +maindeck維護render
        this.loadDeckList();
      },
      error: (err) => {
        console.error('設定失敗', err);
        alert('設定失敗，請稍後再試');
      }
    });
  }

  delete_deck() {
    if (!this.selected_deck_id) return;


    this.isDeleting = true; // 1. 刪除前先把鎖打開 loaddecklist和select別再檢查!

    const url = `http://localhost:8080/api/deck_editor/delete_deck?deckId=${this.selected_deck_id}`;

    this.http.post(url, {}, this.httpOptions).subscribe({
      next: () => {
        console.log('正要delete牌組成功');

        // 重要：更新前端狀態，讓按鈕立刻變色/禁用
        // this.selected_deck_defaulted = true;

        // 重新抓取清單，確保 userDecks 裡的資料也是最新的   ***刷新 +顯示預設+  selected deckid維護 +maindeck維護render
        this.loadDeckList();
        //   if (this.userDecks.length > 0) {
        //   // ✅ 方案：自動跳到最新的一副
        //   const first = this.userDecks[this.userDecks.length-1];
        //   this.selected_deck_id = first.id;
        //   this.selected_deck_name = first.deck_name;

        //   // 觸發讀取這副牌的卡片，畫面就不會卡死
        //   this.selectDeck();
        // } else {
        //  console.log('所有牌組已刪除，自動進入新建模式');
        //   this.new_deck();
        // }

      },
      error: (err) => {
        console.error('設定失敗', err);
        alert('設定失敗，請稍後再試');
      }
    });
  }


  copy_deck() {
    this.selected_deck_name = this.selected_deck_name + "_copy";
    this.save_deck(0, this.selected_deck_name, this.email, false, this.mainDeck, this.fusionDeck, this.sideDeck);
  }

  new_deck() {


    if (this.isGuest()) {
      // this.showGuestWarning();
      console.log('你是訪客 無法save deck');

//             this.dialog.open(DialogInformComponent, {
//   width: '400px',
//   disableClose: true, // 👈 加上這行，點空白處就不會關閉了
//   data: {
//     title: 'guest',
//     content: '訪客無法創建/編輯/命名牌組 ',

//   }
// });

      return; // 關鍵：攔截，不讓後面的代碼跑
    }

    this.mainDeck = [];
    this.fusionDeck = [];
    this.sideDeck = [];

    this.selected_deck_name = "new_deck";
    this.editing_name = this.selected_deck_name;

    this.selected_deck_id = 0;///其實沒啥意義
    this.selected_deck_defaulted = false;///其實沒啥意義





    //  this.selected_deck_name="new_deck";
    //   this.editing_name=this.selected_deck_name; 已經okok 顯示並讓它命名拉!
    this.rename_boolean = true;
    setTimeout(() => {
      this.rename.nativeElement.focus();
      this.rename.nativeElement.select(); // 這樣會把文字反白，打第一個字就直接覆蓋舊名
    }, 350);


  }



  rename_step1() {

    console.log("垃圾狗", this.editing_name);



    if (this.isGuest()) {
      // this.showGuestWarning();
      console.log('你是訪客 無撒save deck');


//             this.dialog.open(DialogInformComponent, {
//   width: '400px',
//   disableClose: true, // 👈 加上這行，點空白處就不會關閉了
//   data: {
//     title: 'guest',
//     content: '訪客無法創建/編輯/命名牌組 ',

//   }
// });


      return; // 關鍵：攔截，不讓後面的代碼跑
    }

    this.rename_boolean = true; // 1. 先打開開關，讓 input 出現



// 2. 使用 setTimeout (哪怕是 0 毫秒) 或是微任務
  // 這會強迫 Angular 先去跑完渲染，等 input 真的在畫面上後，再執行裡面的賦值
  setTimeout(() => {
    this.editing_name = this.selected_deck_name;
    console.log("現在賦值才有效，因為 input 已經生出來了:", this.editing_name);

    if (this.rename) {
      this.rename.nativeElement.focus();
    }
  }, 0);





    setTimeout(() => {
      this.rename.nativeElement.focus();
      // this.rename.nativeElement.select(); // 這樣會把文字反白，打第一個字就直接覆蓋舊名
    }, 200);
  }
  rename_front_end_save() {

    // 2. 檢查名稱是否為空
    if (!this.editing_name) {
      console.warn("⚠️ 名稱不能為空！");
      alert("請輸入牌組名稱");
      return;
    }

    // 3. 比對是否與現有牌組清單重複 (排除掉自己目前的 ID)
    const isDuplicate = this.userDecks.some(deck =>
      deck.deck_name === this.editing_name && deck.id !== this.selected_deck_id
    );

    if (isDuplicate) {
      console.error("🚫 命名衝突：已經有同名的牌組了！");
      alert("已有同名牌組，請換個名字！");
      return; // 直接中斷，不執行下面的賦值
    }







    // 4. 檢查過關，更新前端顯示
    console.log("✅ 名稱檢查通過，更新為:", this.editing_name);

    // 找到 userDecks 陣列中符合當前 ID 的物件
    const targetDeck = this.userDecks.find(deck => deck.id === this.selected_deck_id);
    if (targetDeck) {
      // 找到物件後，同步更新陣列裡的名字
      targetDeck.deck_name = this.editing_name;
      // 同步更新當前選中的名稱顯示
      this.selected_deck_name = this.editing_name;

      console.log("📁 已成功更新 userDecks 陣列中的牌組名稱");
    } else {
      console.error("❌ 在 userDecks 中找不到對應的 ID:", this.selected_deck_id);
    }

    this.rename_boolean = false;
    this.editing_name = ""; // 清空暫存
    // console.log("  this.selected_deck_name");

    this.refresh_main_deck();
  }


  // save_rename(){
  //   if (!this.selected_deck_id) return;


  // const url = `http://localhost:8080/api/deck_editor/rename_deck?deckId=${this.selected_deck_id}&
  // editing_name=${this.editing_name}`;

  //   this.http.post(url, {}, this.httpOptions).subscribe({
  //     next: () => {
  //     console.log('正要delete牌組成功');

  //       // 重要：更新前端狀態，讓按鈕立刻變色/禁用
  //       // this.selected_deck_defaulted = true;

  //       // 重新抓取清單，確保 userDecks 裡的資料也是最新的   ***刷新 +顯示預設+  selected deckid維護 +maindeck維護render
  //       this.loadDeckList();

  //        this.rename_boolean=false;
  //         this.editing_name="";
  //     },
  //     error: (err) => {
  //       console.error('設定失敗', err);
  //        this.rename_boolean=false;
  //         this.editing_name="";

  //     }
  //   });

  // }















  // 5. 處理正常的拖放邏輯（排序或跨籃子移動）
  drop(event: CdkDragDrop<any[]>) {
    const cardobj = event.item.data;
    console.log(cardobj);

    // 1. 判定是否「真的掉在外面」
    // 只要 event.container 等於 event.previousContainer，且指標不在容器上，就是掉在外面 貨卡持
    const droppedOutside = !event.isPointerOverContainer;
    const droppedInPool = event.container.id === 'card_pool';
    if (droppedOutside || droppedInPool) {
      if (event.previousContainer.id !== 'card_pool') {
        // 執行踢出
        // 原始狀態長相 二微陣列：按區域分組
        // this.sections = [
        //   ['紅龍', '青龍'], // 第一區
        //   ['黑魔導', '黑魔導女孩'], // 第二區
        //   ['栗子球'] // 第三區
        // ];


        event.previousContainer.data.splice(event.previousIndex, 1);


        // 執行 flat()
        this.mainDeck = this.sections.flat();
        // 結果：變成一個完整的總清單
        // this.mainDeck => ['紅龍', '青龍', '黑魔導', '黑魔導女孩', '栗子球']
        this.refresh_main_deck(); // 踢完立刻重整 因為這需要maindeck玩整平坦的 去讓refresh 變成4個div row 去渲染維護ok
        console.log('透過 Drop 事件成功踢出');
      }
      return; // 結束，不要跑後續邏輯
    }






    // 1. 判斷是否在同一行內移動
    if (event.previousContainer === event.container) {

      // 這是關鍵：只動這一行的局部陣列，不要動到 mainDeck，也不要執行 refresh
      // 這樣 CDK 的內建動畫才能跑完，且不會觸發 Angular 全域重繪
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

      // 選做：如果你一定要同步回總陣列，請確保不要呼叫會重切 sections 的方法
      // 或是用一個簡單的循環把 sections 拼回 mainDeck 即可
      this.mainDeck = this.sections.flat();

    } else {


      // 1. 取得原始拖拽資料
      let draggedData = event.item.data;
      let currentCard: any;

      // 2. 預處理：確保我們拿到的是完整的物件資訊
      if (typeof draggedData === 'string') {
        // 如果是字串 (來自 main_deck)，去全卡池裡找這張怪獸的資料
        // 假設你所有的卡片資料存放在 allCards 這個陣列中
        currentCard = this.cardPool.find(c => c.passcode === draggedData);
      } else {
        // 如果是物件 (來自 card_pool)，直接使用
        currentCard = draggedData;
      }

      // 如果找不到卡片資料，安全退回
      if (!currentCard) return;


      // 3. 攔截規則
      // 融合怪獸禁止進入 Main Deck
      if (event.container.id.startsWith('main_deck') && currentCard.sub_type === 'fusion') {
        console.log('融合怪獸不能放入主牌組！');
        return;
      }

      // 非融合怪獸禁止進入 Extra Deck
      if (event.container.id === 'extra_deck' && currentCard.sub_type !== 'fusion') {
        console.log('只有融合怪獸能放入額外牌組！');
        return;
      }

      // 規則 B：檢查 Main Deck 數量上限 (假設為 60 張)
      // 注意：如果是從外部移入 (transferArrayItem)，才需要檢查上限
      if (event.container.id.startsWith('main_deck') && event.previousContainer !== event.container) {

        console.log("我在這 印出");
        console.log(event.container.data);
        if (this.reach_limit(cardobj.passcode, this.mainDeck, this.sideDeck)) { console.log("我在這 angry"); return; }

        if (event.container.data.length >= 60) {
          console.log('主牌組已滿（上限 60 張）！');
          return;
        }
      }

      if (event.container.id === 'extra_deck' && event.previousContainer !== event.container) {

        if (this.reach_limit(cardobj.passcode, this.fusionDeck)) { return; }

        if (event.container.data.length >= 15) {
          console.log('額外牌組已滿（上限 60 張）！');
          return;
        }
      }
      if (event.container.id === 'side_deck' && event.previousContainer !== event.container) {
        console.log('asfs');
        console.log(cardobj.passcode);
        console.log(this.sideDeck);
        if (this.reach_limit(cardobj.passcode, this.sideDeck, this.mainDeck)) {
          console.log('side牌組已滿（3333！');
          return;
        }

        if (event.container.data.length >= 15) {
          console.log('side牌組已滿（上限 15 張）！');
          return;
        }
      }

      /////////ok必須這樣 不要用is over container那些的ondrag ecit啥的 總之就是確認..以下....kkk
      // --- 4. 通過檢查後，執行原本的移動邏輯 ---
      if (event.container.id === 'card_pool' || !event.isPointerOverContainer) {
        // 如果掉回卡池，或者是掉在容器外
        if (event.previousContainer.id !== 'card_pool') {   ///如果不適從卡池到卡池
          event.previousContainer.data.splice(event.previousIndex, 1);
          console.log('這才是安全的踢出');
        }
      }
      else if (event.previousContainer === event.container) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex); return;
      } else if (event.previousContainer.id === 'card_pool') {
        // 這裡我們只存入 passcode 字串到 Deck
        event.container.data.splice(event.currentIndex, 0, currentCard.passcode);
      } else {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );


        // 關鍵：每次移動完，立刻「合併再重切」
        this.mainDeck = [
          ...this.sections[0], ...this.sections[1], ...this.sections[2],
          ...this.sections[3], ...this.sections[4], ...this.sections[5]
        ];

        // 重新平衡，確保每排又是 10 張，且卡片會「自動回彈補位」
        this.refresh_main_deck();


      }
      console.log('當前落位索引:', event.currentIndex);
    }


    ///但因為有些是 刪除或啥的 部會執行到最下面就return了// whatever nvm 這邊補這兩行=萬能gd以後再重搞架構etc 一開始要架構弄好 dck drag suck 不如自己做設計 和整體架構s
    /////////統一在這裡重作 上面的都能山衣衫.
    this.mainDeck = this.sections.flat();
    this.refresh_main_deck();
  }


  // 當進入任何一個籃子 (Main, Extra, Side...)
  onEntered() {
    this.isOverContainer = true;
  }

  // 當離開任何一個籃子
  onExited() {
    this.isOverContainer = false;
  }

  // 關鍵：無論掉在哪裡都會觸發的事件
  onDragEnded(index: number, array: any[]) {
    ///非同步判斷啥的bad
    // 這邊跑完納編不一定能跑ok
    // 捨棄用這

    // // 修正邏輯：
    // // 只有當 isOutside 是 true，且沒有掉入任何連線的 DropList 時才刪除
    // if (!this.isOverContainer) {
    //   // 為了保險，我們可以在這裡多加一個判斷，或是利用 setTimeout 稍微延遲
    //   // 但最乾淨的做法是直接在 drop 事件裡重置 isOutside
    //   array.splice(index, 1);
    //   console.log('踢出卡片');
    // }

    // // 重置狀態
    // this.isOverContainer = false;
  }

  language_a(change_to: String) {
    if (change_to == 'cn') { this.language = "cn"; return; }
    if (change_to == 'en') { this.language = "en"; return; }

  }
  change_language() {
    if (this.language == "cn") { this.language = "en"; return; }
    if (this.language == "en") { this.language = "cn"; return; }
  }

  clear(area: string) {
    if (area == "main_deck") { this.mainDeck = []; this.refresh_main_deck(); }
    if (area == "extra_deck") { this.fusionDeck = []; }
    if (area == "side_deck") { this.sideDeck = []; }
  }
  // 在你的 Component 類別中
  trackBycardCode(index: number, cardCode: string): string {
    // 回傳這筆資料的唯一識別碼（通常是 passcode）
    // 只要回傳值不變，Angular 就不會重新渲染這個 DOM 節點
    return cardCode;
  }




  ///只有一開始init 去維護 卡圖.getter之類的
  load_skin() {
    const payload = {
      email: this.email   // 這裡就是 "data:image/jpeg;base64,..."
    };

    // 1. 在 post 後面改成 <any[]>
    this.http.post<any[]>('http://localhost:8080/api/profile/get_fixed_img_and_gif', payload, this.httpOptions)
      .subscribe((skindata: any) => {

        console.log('API 認證成功，skin自定義資料已載入');

        // 假設 skins 是你從後端拿到的 List<Map> 重新賦值gd so有新增這些欄位
        this.cardPool = this.cardPool.map(card => {
          const mySkin = skindata.find((s: any) => s.cardcode === card.passcode);
          return {
            ...card,
            // 如果有自定義資料就放進去，沒有就給 null 或預設值
            fixed_img_path: mySkin ? mySkin.fixed_img_path : null,
            gif: mySkin ? mySkin.gif : null
          };
        }); // <-- 結束 map


        console.log(this.cardPool);
        console.log('aaa');
        // this.cardPool = [...this.cardPool];
        //  this.apply_filteredPool();
      }); // <-- 結束 api
  } // <-- 結束 load_skin
















  go_random() {
    this.sortMode = 'random';

    // 先抓取目前過濾後的基礎資料
    let pool = this.cardPool// 建議把 filter 邏輯抽出來

    // 執行 Fisher-Yates 洗牌
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    this.randomizedResult = [...pool];
  }
  to_not_random() {
    this.sortMode = "default";
  }

  onLogout() {
    localStorage.clear();
    window.location.href = '/login'; // 或使用 Router
  }
  //   applyFilter() {
  //   this.filteredPool = this.cardPool.filter(card => {
  //     const matchName = card.name.toLowerCase().includes(this.filter.name.toLowerCase());
  //     const matchType = !this.filter.type || card.type === this.filter.type;
  //     const matchTier = (card.tier >= this.filter.tierMin && card.tier <= this.filter.tierMax);
  //     return matchName && matchType && matchTier;
  //   });
  // }
  // 檢查是否為訪客
  isGuest(): boolean {
    // 檢查名稱是否以 'guest' 開頭 (不分大小寫)
    const userName = (this.email || '').toLowerCase();
    return userName.startsWith('guest');
  }

  // 2. 寫一個簡單的方法來轉換
  get_en_cn_text(text_input: string): string {
    // 預防萬一：如果 language 或 status 找不到，回傳原始字串
    // 根據 指令 language去
    // 第二組 [text_input]：進了教室後，根據你手上的單字（text_input，如 'normal'），去找對應的課桌椅（翻譯結果）。

    return this.language === 'cn'
      ? (mapp['cn']?.[text_input] || text_input)
      : text_input;  ///總之就是去找和查表
  }


  private reach_limit(cardCode: string, targetList: any[], targetList2?: any[]): boolean {
    // 1. 過濾出所有 code 相同的卡片
    // 因為陣列裡直接就是字串，所以 card 就是字串本身
    const count = targetList.filter(card => card === cardCode).length;

    const count2 = targetList2?.filter(card => card === cardCode).length;

    // 2. 判斷是否已經等於 3
    if (count >= 3) {
      console.warn(`卡片 ${cardCode} 已達數量上限 (3張)！`);
      return true;
    }

    // 2. 判斷是否已經等於 3
    if (count2 != null && count2 >= 3) {
      console.warn(`卡片 ${cardCode} 已達數量上限 (3張)！`);
      return true;
    }

    return false; ///達到3就return true
  }

}






const mapp: any = {
  cn: {
    // 基本分類
    'magic': '魔法卡',
    'trap': '陷阱卡',
    'monster': '怪獸',

    // 怪物類型 / 魔法陷阱種類
    'normal': '通常',
    'effect': '效果',
    'ritual': '儀式',
    'fusion': '融合',

    'quick-play': '速攻',
    'equip': '裝備',
    'continuous_spell': '永續',
    'field': '場地',
    'counter': '反擊',

    // 種族 (Monster Types)
    'aqua': '水族',
    'beast': '獸族',
    'beast-warrior': '獸戰士族',
    'dinosaur': '恐龍族',
    'divine-beast': '幻神獸族',
    'dragon': '龍族',
    'fairy': '天使族',
    'fiend': '惡魔族',
    'fish': '魚族',
    'insect': '昆蟲族',
    'machine': '機械族',
    'plant': '植物族',
    'pyro': '炎族',
    'reptile': '爬蟲類族',
    'rock': '岩石族',
    'sea serpent': '海龍族',
    'spellcaster': '魔法使族',
    'thunder': '雷族',
    'warrior': '戰士族',
    'winged beast': '鳥獸族',
    'zombie': '不死族',

    // 屬性 (Attributes)
    'dark': '暗',
    'fire': '火',
    'wind': '風',
    'light': '光',
    'water': '水',
    'earth': '地',
    'divine': '神' // 補充幻神獸通常對應神屬性
  }
};
interface CardFilter {
  name: string;
  description: string;
  card_type: string;
  sub_type: string;
  race: string;
  attribute: string;
  levelMin: number | null; // 這裡定義允許 null
  levelMax: number | null;
  atkMin: number | null;
  atkMax: number | null;
  defMin: number | null;
  defMax: number | null;
  tierMin: number | null;
  tierMax: number | null;
  cn_name: string;
  cn_text: string;
}
