const ja = {
  // App
  app_name: "Pirate Money",
  app_title: "Pirate Money | 円をかせごう!",
  app_description: "おうちのお手伝いで円をかせごう!",

  // Home page
  home_who_are_you: "だれですか?",
  home_parent_name: "ママ & パパ",
  home_parent_subtitle: "海賊クルー",
  home_jayden_subtitle: "ホオジロザメ - 7さい",
  home_tyler_subtitle: "イルカ - 4さい",

  // Error pages
  error_title: "エラーが発生しました",
  error_description: "予期しないエラーが発生しました。もう一度お試しください。",
  error_retry: "もう一度",
  not_found_title: "ページが見つかりません",
  not_found_description: "お探しのページは存在しないか、移動されました。",
  not_found_go_home: "ホームへ",

  // Kid
  kid_invalid_child: "だれですか? 🤔",
  kid_loading: "よみこみちゅう...", // F18: 込 is 中学校 kanji — hiragana for kid surface
  kid_home: "ホーム",
  kid_header_jobs: "{{name}}のおしごと",
  kid_header_shark: "ホオジロザメ",
  kid_header_dolphin: "イルカ",
  kid_header_age: "{{age}}さい",
  kid_upcoming_title: "こんしゅうのこれから",
  kid_upcoming_empty: "こんしゅうのこれからのおしごとはまだないよ。",
  kid_history_title: "たからものれきし",
  kid_history_this_week: "こんしゅう",
  kid_history_prev_week: "せんしゅう",
  kid_history_next_week: "らいしゅう",
  kid_history_empty: "こんしゅうはまだたからものをもらってないよ。",
  kid_history_jobs: "{{count}}こ",

  // Weekly tracker
  weekly_treasure_title: "こんしゅうのたからもの",
  weekly_progress: "¥{{total}}のうち¥{{earned}}",
  treasure_grand_total: "ぜんぶのたからもの",
  treasure_this_week: "こんしゅう",

  // Treasure chest
  treasure_your_treasure: "きみのたからもの",
  treasure_tap_to_close: "どこかをタップしてとじる",

  // Kanban
  kanban_columns_label: "おしごとボードのれつ",
  kanban_available: "できるおしごと",
  kanban_doing: "やっているよ!",
  kanban_done: "おわった!",
  kanban_empty_available: "ぜんぶとったよ!",
  kanban_empty_doing: "おしごとをえらぼう!",
  kanban_empty_done: "おしごとをおわらせてここにみよう!",

  // Job card
  job_start: "やるぞ! 💪",
  job_complete: "やったよ! ✅",
  job_waiting: "ママかパパをまってるよ",
  job_try_again_note: "なにをなおして もういっかい やってほしい? {{note}}",

  // Celebration
  // F18: 「よくできました」is keigo on a kid surface — switch to plain-form 「できたね!」
  celebration_great_job: "よくできたね!",
  celebration_waiting: "ママかパパがチェックするのをまってね",

  // Parent tabs
  tab_navigation_label: "親のダッシュボードのセクション",
  tab_quick_add: "今日すぐ追加 ⚡",
  tab_approvals: "しょうにん ✅",
  tab_planner: "よてい 📅",
  tab_jobs: "おしごと 📜",
  tab_overview: "まとめ 👀",

  // Parent header
  parent_home: "ホーム",
  parent_header_title: "船長のブリッジ",
  parent_header_subtitle: "ママ & パパのコマンドセンター",
  parent_captain_code: "船長コード",
  parent_captain_code_on: "オン",
  parent_captain_code_off: "オフ",

  // Approval queue
  approval_all_clear: "全部OKです、船長!",
  approval_no_jobs: "承認待ちのお仕事はありません",
  approval_waiting_title: "承認待ち ({{count}})",

  // Approval card
  approval_approve: "承認 ✅",
  approval_reject: "もう一回 🔄",
  approval_reject_note_prompt: "もう一回やる前に、何を直してほしいですか?",
  approval_photo_proof: "写真のしょうこ",
  approval_photo_proof_alt: "お仕事完了の写真",
  // F20 — tap-to-enlarge + close labels for the proof preview modal.
  approval_photo_tap_to_enlarge: "タップで拡大",
  approval_photo_preview_close: "閉じる",
  // F20 — JobManager row icon button aria-labels.
  job_manager_edit_aria: "お仕事を編集",
  job_manager_delete_aria: "お仕事を削除",
  // F20 — WeekPlanner mobile day-picker labels.
  planner_day_picker_label: "曜日を選ぶ",
  planner_view_mode_grid: "週ぜんぶ",
  planner_view_mode_day: "1日ずつ",

  // Job manager
  job_manager_title: "おしごとライブラリ ({{count}})",
  job_manager_new: "+ 新しいお仕事",
  job_manager_quick_assign: "今日わりあてる",
  job_manager_choose_child: "だれに",
  job_manager_photo_proof: "写真のしょうこが必要",

  // Job form
  job_form_edit_title: "お仕事を編集",
  job_form_add_title: "新しいお仕事を追加",
  job_form_name_label: "お仕事の名前",
  job_form_name_placeholder: "例: おもちゃを片付ける",
  job_form_icon_label: "アイコン",
  job_form_yen_label: "金額 (¥)",
  job_form_recurrence_label: "くりかえし",
  job_form_photo_proof_label: "写真のしょうこを必要にする",
  job_form_photo_proof_hint: "子どもは承認待ちにする前に写真をアップロードします。",
  job_form_cancel: "キャンセル",
  job_form_save: "保存",
  job_form_add: "追加",

  // Week planner
  planner_title: "しゅうかんよてい",
  planner_this_week: "こんしゅう",
  planner_next_week: "らいしゅう",
  planner_prev_week: "せんしゅう",
  planner_today: "きょう",
  planner_tap_to_add: "タップしてお仕事を追加",
  planner_add_jobs: "お仕事を追加",
  planner_no_children: "まずクルーを追加してね!",
  planner_empty_day: "なし",
  planner_clear_day: "クリア",
  planner_bulk_job: "わりあてるおしごと",
  planner_bulk_children: "だれに",
  planner_priority: "たいせつさ",
  planner_priority_optional: "できたら",
  planner_priority_must: "ぜったい",
  planner_all_children_selected: "全員が選ばれています",
  planner_selected_children: "{{count}}人を選択中",
  planner_copy_last_week: "先週をコピー",
  planner_apply_monday: "月曜をテンプレートにする",
  planner_apply_recurring: "くりかえしを入れる",
  planner_crew: "クルー",
  planner_add_selected: "選んだおしごとを追加",
  planner_remove_job: "おしごとを削除",
  priority_must_do: "ぜったい",

  // Photo proof
  photo_proof_required: "写真が必要だよ",
  photo_proof_choose: "写真をとる / えらぶ",
  photo_proof_chosen: "{{name}}を選んだよ",
  photo_proof_uploading: "アップロード中...",
  photo_proof_error: "写真をアップロードできませんでした。もう一度試してね。",

  // Recurrence
  recurrence_none: "くりかえしなし",
  recurrence_daily: "まいにち",
  recurrence_weekdays: "へいじつ",
  recurrence_specificDays: "曜日をえらぶ",
  recurrence_day_0: "月",
  recurrence_day_1: "火",
  recurrence_day_2: "水",
  recurrence_day_3: "木",
  recurrence_day_4: "金",
  recurrence_day_5: "土",
  recurrence_day_6: "日",

  // Quick assign
  quick_assign_title: "今日わりあてる",
  quick_assign_who: "だれに",

  // Quick add today
  quick_add_title: "今日すぐ追加",
  quick_add_subtitle: "おしごとをタップして、だれにするかえらぶだけ。すぐ今日のリストに追加できます。",
  quick_add_empty_jobs: "まずおしごとライブラリにおしごとを追加してね。",
  quick_add_empty_children: "まずクルーを追加してからおしごとをわりあててね。",
  quick_add_choose_who: "だれにする?",
  quick_add_preapprove: "すぐ承認しておこづかいにする",
  quick_add_preapprove_hint: "子どものリストと承認待ちをスキップして、すぐにたからものへ追加します。",
  quick_add_confirm: "追加する",
  quick_add_assigning: "追加中...",

  // One-off task
  oneoff_title: "いちどきりのおしごと",
  oneoff_subtitle: "ライブラリにはほぞんされません",
  oneoff_name_placeholder: "例: ちらかしたのをかたづけて",
  oneoff_assign_to: "だれに",
  oneoff_create: "つくってわりあてる",

  // Kanban (updated)
  // F18: dropped kanji 今日/仕事 to keep hiragana register consistent with other
  // kid-facing strings (おしごと is the canonical kid-voice term for "chore").
  kanban_no_jobs_today: "きょうのおしごとはないよ!",
  kanban_no_jobs_hint: "ママかパパにおしごとをついかしてもらおう!",

  // Child overview
  overview_earned: "かせいだ",
  overview_possible: "かせげる",
  overview_in_progress: "やっている",
  overview_completed: "おわった",
  overview_waiting: "⏳ {{count}}つのお仕事が承認待ち",

  // Wallet
  wallet_spend: "つかう",
  wallet_save: "ためる",
  wallet_give: "あげる",
  wallet_total: "ぜんぶのたからもの",

  // Withdrawals
  withdraw_open: "引き出し",
  withdraw_title: "{{name}}から引き出し",
  withdraw_jar: "つぼ",
  withdraw_amount: "金額",
  withdraw_available: "使える金額",
  withdraw_reason: "理由",
  withdraw_reason_cashOut: "現金で渡した",
  withdraw_reason_penalty: "ペナルティ",
  withdraw_reason_correction: "まちがいなおし",
  withdraw_reason_other: "その他",
  withdrawal_reason_penalty_kid: "ちょうせい",
  withdraw_note: "メモ",
  withdraw_note_placeholder: "何のための引き出し?",
  withdraw_submit: "引き出しを記録",
  withdraw_saving: "記録中...",
  withdraw_error_amount: "¥0より大きい金額を入れてください。",
  withdraw_error_balance: "このつぼには十分なたからものがありません。",
  withdraw_error_note: "その他の理由にはメモを入れてください。",
  withdraw_error_generic: "引き出しを記録できませんでした。",

  // Bonuses
  bonus_open: "ボーナス",
  bonus_title: "{{name}}にボーナス",
  bonus_amount: "金額",
  bonus_note: "理由",
  bonus_note_placeholder: "何をよくできた?",
  bonus_split_hint: "ボーナスは、つかう / ためる / あげるに 70 / 20 / 10 で分けます。",
  bonus_submit: "ボーナスをあげる",
  bonus_saving: "追加中...",
  bonus_error_amount: "¥0より大きい金額を入れてください。",
  bonus_error_generic: "ボーナスを追加できませんでした。",

  // Lucky Chest
  lucky_chest_title: "ラッキーチェスト",
  // F18: 「宝箱」mixes 小6 + 小3 kanji on a kid surface — use hiragana.
  lucky_chest_sleeping_title: "こんしゅうはたからばこ おやすみ",
  // F18 — Replace katakana loanword "マストドゥ" with native "ぜったいのおしごと"
  // (matches kanban/planner vocab). Kid audience can't parse mastodu.
  lucky_chest_sleeping_hint: "ぜったいのおしごとがついかされると、つぎのしゅうおきるよ!",
  // F18: 「承認済み」is 小5–6 kanji + keigo register — replace with kid-readable
  // 「OKがでた」which matches the approval button vocabulary the kid already sees.
  lucky_chest_locked: "こんしゅうのぜったいおしごと {{total}}このうち{{done}}こ OKがでたよ。",
  // F18 — Soften gambling-adjacent language: 当たる ("win/hit") → もらえる ("receive")
  // reframes the chest as a reward for finishing the week's must-do work, not a
  // lottery roll. Matches the EN "Open it for up to ¥X" phrasing.
  lucky_chest_unlocked: "あいたよ! さいだい¥{{amount}}までもらえるよ。",
  lucky_chest_opened: "こんしゅうのほうび: ¥{{amount}}をたからものに ついかしたよ。",
  lucky_chest_open: "あける",
  lucky_chest_opening: "あけている...",
  // F18: keigo-leaning でした → plain よ-ending for kid surface.
  lucky_chest_error: "チェストをあけられなかったよ。もういちどためしてね。",
  lucky_chest_parent_title: "ラッキーチェスト",
  // F18 — Reframe as "weekly reward" (ぼうけんのほうび) rather than chance-based.
  // Lewis's PRD principle #2: no fear, no gambling vibes — chest is a thank-you
  // for finishing the must-do work, not a roll of the dice.
  lucky_chest_parent_subtitle: "今週のぜったいおしごとが全部おわると、しゅう1回ほうびのチェストをひらけます。",
  lucky_chest_max_label: "最高 ¥",
  lucky_chest_save: "保存",

  // Goals
  goal_title: "ためるゴール",
  // F18: 次/使 → hiragana for 4yo readability; warmer tone.
  goal_subtitle: "ためるつぼは、つぎにほしいもののためにつかうよ。",
  goal_empty: "まだゴールがないよ",
  goal_empty_subtitle: "ほしいものを決めて、ためるつぼをいっぱいにしよう。",
  goal_save_balance: "ためるつぼ: ¥{{amount}}",
  goal_funded: "たまった",
  goal_ready: "もうとどくよ!",
  goal_remaining: "あと¥{{amount}}",
  goal_name_placeholder: "何のためにためる?",
  goal_amount_placeholder: "¥ ゴール",
  goal_create: "ゴールにする",
  goal_saving: "保存中...",
  goal_error_title: "まずゴールの名前を入れてね。",
  goal_error_amount: "¥0より大きいゴール金額を入れてね。",
  goal_error_generic: "ゴールを保存できませんでした。",
  goal_swap_reassurance: "¥{{amount}}はなくならないよ。これからは{{name}}のためにたまるよ。",
  goal_big_dream_hint: "おおきなゆめだね! まいしゅう ためていくと、もっとちかづくよ!",

  // Ranks
  rank_board_title: "クルーランク",
  rank_current: "いまのランク",
  rank_score: "{{score}}ランクポイント",
  rank_next: "つぎ: {{score}}で{{rank}}",
  rank_max: "さいこうランク!",
  rank_up_toast_title: "ランクアップ!",
  rank_up_toast_body: "おめでとう、{{rank}}!",
  // G5: kid-spoken hiragana register (F18). Wrapped in BudouXText at the
  // call site so the longer lines break on phrase boundaries.
  rank_kudos_above_avg:
    "こんしゅうは ¥{{amount}} かせいだよ! いつもより {{percent}}% おおい! がんばってる!",
  rank_kudos_at_avg:
    "こんしゅうは ¥{{amount}} かせいだよ! いつもどおりのペース!",
  rank_kudos_below_avg:
    "こんしゅうは ¥{{amount}}。いつもよりちょっとすくないけど、ちいさいいっぽも たいせつだよ。",
  rank_toggle_lifetime: "ぜんぶ",
  rank_toggle_weekly: "こんしゅう",

  // Job titles
  job_fold_washing: "せんたくものをたたむ",
  job_clean_toys: "おもちゃをかたづける",
  job_make_bed: "ベッドをつくる",
  job_set_table: "テーブルをセットする",
  job_water_plants: "おはなにお水をあげる",
  job_put_shoes_away: "くつをなおす",
  job_feed_pets: "ペットにごはんをあげる",
  job_dishes_sink: "おさらをシンクに置く",
  job_pick_books: "ほんをひろう",
  job_wipe_table: "テーブルをふく",
  job_dirty_clothes: "よごれたふくをかごに入れる",
  job_tidy_room: "おへやをきれいにする",
  job_setup_futon: "ふとんをしくのをてつだう",
  job_brush_teeth: "はみがきする(いわれなくても!)",
  job_pack_school_bag: "ランドセルのしたく",
  job_put_away_groceries: "かいものをしまう",
  job_sweep_floor: "ゆかをはく",
  job_wipe_windows: "まどをふく",
  job_sort_recycling: "リサイクルをわける",
  job_help_cook: "りょうりのてつだい",

  // Onboarding
  onboarding_welcome: "Pirate Moneyへようこそ!",
  onboarding_welcome_subtitle: "船長さん、こんにちは! たからものいっぱいの冒険に出かけよう! クルーをあつめて、円をかせごう!",
  onboarding_get_started: "はじめよう",
  onboarding_add_crew: "クルーはだれ?",
  onboarding_add_crew_subtitle: "おこさまを追加してください。最大6人まで追加できます。",
  onboarding_child_name: "クルーの名前",
  onboarding_choose_icon: "うみの生き物をえらぼう",
  onboarding_add_another: "+ クルーを追加",
  onboarding_remove_child: "はずす",
  onboarding_next: "つぎへ",
  onboarding_back: "もどる",
  onboarding_all_done: "準備完了!",
  onboarding_all_done_subtitle: "クルーの準備ができました!",
  onboarding_your_crew: "きみのクルー",
  onboarding_start_adventure: "冒険をはじめよう!",
  onboarding_saving: "出航中...",
  onboarding_at_least_one: "クルーを1人は追加してね",
  onboarding_step: "ステップ {{current}} / {{total}}",

  // Onboarding - Jobs step
  onboarding_add_jobs: "おしごとをつくろう",
  onboarding_add_jobs_subtitle: "クルーがたからものをかせぐおしごとは? すくなくとも1つ追加してね。",
  onboarding_job_name: "おしごとの名前",
  onboarding_job_name_placeholder: "れい: おもちゃをかたづける",
  onboarding_job_yen: "金額 (¥)",
  onboarding_add_job: "+ おしごとを追加",
  onboarding_remove_job: "はずす",

  // Math challenge
  math_challenge_title: "船長のコード",
  math_challenge_subtitle: "ブリッジに入るにはとけ!",
  math_challenge_placeholder: "こたえ",
  math_challenge_submit: "入る",
  math_challenge_wrong: "ちがうよ!もういちど、船長。",
  math_challenge_hint: "船長だけがはいれるよ!",

  // Child management
  children_title: "クルーメンバー",
  children_add: "+ クルーを追加",
  children_empty: "まだクルーがいません!",
  children_empty_subtitle: "最初のちいさな海賊を追加しよう。",
  children_form_add_title: "クルーを追加",
  children_form_edit_title: "クルーを編集",
  children_form_name_label: "なまえ",
  children_form_name_placeholder: "れい: ジェイデン",
  children_form_icon_label: "アイコンをえらぼう",
  children_form_save: "ほぞん",
  children_form_cancel: "キャンセル",
  children_delete_confirm: "このクルーメンバーを削除しますか?",

  // Parent tabs
  tab_children: "クルー \u{1F465}",

  // Home
  home_add_children_hint: "船長のブリッジでクルーを追加しよう!",
  home_no_children: "まだクルーがいません",

  // Auth
  auth_sign_in_title: "おかえり、船長!",
  auth_sign_in_subtitle: "お船に乗ろう",
  auth_sign_up_title: "クルーに入ろう!",
  auth_sign_up_subtitle: "たからもの冒険を始めよう",
  auth_logout: "ログアウト",

  // F11 — Empty states (parent dashboard)
  job_library_empty_title: "おしごとライブラリはまだからっぽです",
  // F18 (resolves F11 CMO-review): 「見えません」reads as a flat negative; reframe as
  // a positive sequencing message — child can start once the library has content.
  job_library_empty_hint: "「+ 新しいお仕事」をタップして最初のおしごとを追加すると、子どものリストに出てきます。",
  job_library_empty_cta: "+ 最初のおしごとを追加",
  // F18 (resolves F11 CMO-review): parent surface — keep the celebratory tone but
  // pair it with parent-actionable framing rather than 「みんなえらい」kid-voice alone.
  approvals_empty_title: "全部おわっています! 船長、おつかれさま。",
  approvals_empty_hint: "子どもがおしごとをおわらせると、ここにしょうにん待ちで出てきます。",
  quick_add_empty_title: "今日のクイック追加はありません",
  quick_add_empty_hint: "上のおしごとをタップして今日に追加するか、よていタブで一週間ぶんを計画してください。",
  quick_add_empty_jobs_title: "おしごとライブラリはまだからっぽです",
  child_manager_no_kids: "まだクルーがいません",
  child_manager_no_kids_hint: "最初のおこさまを追加して、冒険をはじめよう。",
  planner_empty_title: "計画するクルーがいません",
  planner_empty_hint: "クルータブで子どもを1人以上追加してから、ここに戻ってきてください。",
  planner_no_jobs_title: "おしごとライブラリがからっぽ",
  // F18 (resolves F11 CMO-review): drop the「チョア」loanword — おしごと is the
  // canonical app term and matches every other planner/kanban string.
  planner_no_jobs_hint: "おしごとタブでおしごとを追加すると、ここにドラッグできるようになります。",
  planner_week_empty_banner: "今週のよていはまだありません — おしごとを曜日にドラッグするか、「月曜をテンプレートにする」をタップしてください。",

  // F11 — Empty states (kid dashboard) — kid-readable hiragana
  kanban_empty_today_title: "きょうのおしごとなし!",
  kanban_empty_today_hint: "あしたまたみてみよう。もっとやりたいときは船長にきいてね。",
  goals_empty_title: "ゴールはまだないよ",
  goals_empty_hint: "なにかほしいものをえらんでね!",
  history_empty_title: "たからものれきしはまだからっぽ",
  history_empty_hint: "おしごとをひとつおわらせるとここにでてくるよ — がんばれ!",
  upcoming_empty_title: "まだよていなし",
  upcoming_empty_hint: "おしごとのよていがないよ — 船長にたのんでみよう!",
  sibling_rank_solo_title: "いまはきみだけ!",
  sibling_rank_solo_hint: "もうひとりクルーがふえると、だれがいちばんかみえるよ。",

  // F12 — Mapped error messages (mapConvexError)
  // F18 (resolves F12 CMO-review): parent surface needs slightly tighter register
  // without going into 敬語 — drop 「ちゃった」filler and use plain 「が切れました」
  // which is informative without being cold.
  error_auth_lost: "ログインが切れました。もう一度ログインしてください。",
  error_network: "船とつながらないよ。インターネットをかくにんしてもう一度ためしてね。",
  error_overdraft: "そのつぼには、引き出すぶんのたからものがたりません。",
  error_lucky_chest_locked: "今週はもうラッキーチェストをあけたよ。月曜にまたためしてね!",
  error_child_deleted: "そのクルーはもう乗っていません。ページを更新します。",
  error_already_approved: "このおしごとはもう承認ずみです。取り消しはいりません。",
  error_ownership: "それはあなたのクルーのものではありません。",
  error_validation: "入力内容にきになるところがあります。確認してもう一度送ってね。",
  error_unknown: "なにかつまずいたみたい。もう一度ためしてね。",

  // F12 — Error / not-found pages (pirate-toned bilingual)
  // F18 (downgrades F12 CMO-review → L2-review): playful kid-friendly framing.
  // Parents may find it juvenile in a serious error context — a native L2-fluent
  // reader should sanity-check whether it lands warm or annoying.
  error_page_title: "あれ、ちずをみうしなった!",
  error_page_subtitle: "だいじょうぶ、たからものはぶじだよ。下のボタンでもう一度ためしてね。",
  error_page_cta: "もう一度",
  not_found_page_title: "この地図にはなにもないよ!",
  not_found_page_subtitle: "そのページが見つかりませんでした。安全なところに戻りましょう。",
  not_found_page_cta: "ホームへもどる",

  // F12 — Photo upload retry
  photo_proof_retry: "もう一度アップロード",

  // F12 — Destructive confirmation dialogs (child)
  child_delete_confirm_title: "{{name}}を削除しますか?",
  child_delete_confirm_body: "つぼ・れきし・よていされたおしごとがすべて消えます。元にはもどせません。",
  child_delete_confirm_cta: "はい、クルーを削除する",
  child_delete_confirm_cancel: "そのままにする",

  // F12 — Destructive confirmation dialogs (job)
  job_delete_confirm_title: "このおしごとを削除しますか?",
  job_delete_confirm_body: "よていされたインスタンスは削除されます。承認ずみのれきしは残ります。元にはもどせません。",
  job_delete_confirm_cta: "はい、削除する",
  job_delete_confirm_cancel: "そのままにする",

  // F12 — ChildManager i18n cleanup
  // F18 (resolves F12 CMO-review): standard parent UI header — no change needed.
  child_manager_header: "クルーメンバー ({{count}})",
  child_manager_add_btn: "+ クルーを追加",
  child_manager_empty_title: "まだクルーがいません!",
  child_manager_empty_subtitle: "最初のちいさな海賊を追加して、冒険をはじめよう。",
  child_manager_empty_cta: "+ クルーを追加",
  child_icon_fallback_label: "サカナ",
  child_manager_delete_aria: "{{name}}を削除",
  child_manager_edit_aria: "{{name}}を編集",

  // F12 — ChildForm i18n cleanup
  child_form_edit_title: "クルーを編集",
  child_form_add_title: "クルーを追加",
  child_form_name_label: "なまえ",
  child_form_name_placeholder: "名前を入力...",
  child_form_icon_label: "アイコンをえらぼう",
  child_form_cancel: "キャンセル",
  child_form_save_edit: "保存",
  child_form_save_add: "クルーに追加",
} as const;

export default ja;
