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
  // S6 (R4) — F10 5.17: styled reject-note dialog replaces window.prompt.
  approval_reject_dialog_title: "もう一回やってもらおう",
  approval_reject_dialog_subtitle:
    "何を直してほしいか、やさしくつたえてあげてください。",
  approval_reject_dialog_placeholder:
    "例: ベッドのまくらの下にまだくつしたがあるよ!",
  approval_reject_dialog_cancel: "キャンセル",
  approval_reject_dialog_submit: "もどす",
  approval_reject_dialog_empty_error:
    "もどす前に、すこしメモを入れてくださいね。",
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
  // S2 (R4) — F10 5.10: disabled-state aria-label when no kids exist.
  job_manager_quick_assign_no_kids_aria:
    "先にクルーを追加してから、おしごとをわりあててね",

  // Job form
  job_form_edit_title: "お仕事を編集",
  job_form_add_title: "新しいお仕事を追加",
  job_form_name_label: "お仕事の名前",
  job_form_name_placeholder: "例: おもちゃを片付ける",
  job_form_icon_label: "アイコン",
  job_form_yen_label: "金額 (¥)",
  job_form_recurrence_label: "くりかえし",
  job_form_photo_proof_label: "写真のしょうこを必要にする",
  job_form_photo_proof_hint:
    "子どもは承認待ちにする前に写真をアップロードします。",
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
  quick_add_subtitle:
    "おしごとをタップして、だれにするかえらぶだけ。すぐ今日のリストに追加できます。",
  quick_add_empty_jobs: "まずおしごとライブラリにおしごとを追加してね。",
  quick_add_empty_children: "まずクルーを追加してからおしごとをわりあててね。",
  quick_add_choose_who: "だれにする?",
  quick_add_preapprove: "すぐ承認しておこづかいにする",
  quick_add_preapprove_hint:
    "子どものリストと承認待ちをスキップして、すぐにたからものへ追加します。",
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
  withdrawal_open_for: "{{name}}のおさいふから引き出す",
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
  // S4 (R4) — F10 5.16: inline max-amount hint + one-tap "Use max" pill.
  withdraw_max_helper: "最大 ¥{{max}}",
  withdraw_use_max: "最大額",

  // Bonuses
  bonus_open: "ボーナス",
  bonus_open_for: "{{name}}にボーナスを渡す",
  bonus_title: "{{name}}にボーナス",
  bonus_amount: "金額",
  bonus_note: "理由",
  bonus_note_placeholder: "何をよくできた?",
  bonus_split_hint:
    "ボーナスは、つかう / ためる / あげるに 70 / 20 / 10 で分けます。",
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
  lucky_chest_sleeping_hint:
    "ぜったいのおしごとがついかされると、つぎのしゅうおきるよ!",
  // F18: 「承認済み」is 小5–6 kanji + keigo register — replace with kid-readable
  // 「OKがでた」which matches the approval button vocabulary the kid already sees.
  lucky_chest_locked:
    "こんしゅうのぜったいおしごと {{total}}このうち{{done}}こ OKがでたよ。",
  // F18 — Soften gambling-adjacent language: 当たる ("win/hit") → もらえる ("receive")
  // reframes the chest as a reward for finishing the week's must-do work, not a
  // lottery roll. Matches the EN "Open it for up to ¥X" phrasing.
  lucky_chest_unlocked: "あいたよ! さいだい¥{{amount}}までもらえるよ。",
  lucky_chest_opened:
    "こんしゅうのほうび: ¥{{amount}}をたからものに ついかしたよ。",
  lucky_chest_open: "あける",
  lucky_chest_opening: "あけている...",
  // F18: keigo-leaning でした → plain よ-ending for kid surface.
  lucky_chest_error: "チェストをあけられなかったよ。もういちどためしてね。",
  lucky_chest_parent_title: "ラッキーチェスト",
  // F18 — Reframe as "weekly reward" (ぼうけんのほうび) rather than chance-based.
  // Lewis's PRD principle #2: no fear, no gambling vibes — chest is a thank-you
  // for finishing the must-do work, not a roll of the dice.
  lucky_chest_parent_subtitle:
    "今週のぜったいおしごとが全部おわると、しゅう1回ほうびのチェストをひらけます。",
  lucky_chest_max_label: "最高 ¥",
  lucky_chest_save: "保存",
  // S2 (R4) — F10 5.19: surface the Monday-roll schedule + amount range.
  lucky_chest_schedule_explainer:
    "毎週月曜日、ぜったいおしごとを全部おえたクルーは ¥10〜¥{{max}} のあいだでチェストをひらきます。",

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
  goal_swap_reassurance:
    "¥{{amount}}はなくならないよ。これからは{{name}}のためにたまるよ。",
  goal_big_dream_hint:
    "おおきなゆめだね! まいしゅう ためていくと、もっとちかづくよ!",

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
  onboarding_welcome_subtitle:
    "船長さん、こんにちは! たからものいっぱいの冒険に出かけよう! クルーをあつめて、円をかせごう!",
  onboarding_get_started: "はじめよう",
  onboarding_add_crew: "クルーはだれ?",
  onboarding_add_crew_subtitle:
    "おこさまを追加してください。最大6人まで追加できます。",
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
  onboarding_add_jobs_subtitle:
    "クルーがたからものをかせぐおしごとは? 自分で追加してもいいし、スキップすれば最初から20個のおしごとを用意します。",
  onboarding_job_name: "おしごとの名前",
  onboarding_job_name_placeholder: "れい: おもちゃをかたづける",
  onboarding_job_yen: "金額 (¥)",
  onboarding_add_job: "+ おしごとを追加",
  onboarding_remove_job: "はずす",
  // H3 — skip-jobs path: empty custom list is fine, defaults always seed.
  onboarding_use_defaults_only:
    "スキップすると、20個の最初のおしごとを用意します",

  // H3 — onboarding save error UX
  onboarding_save_failed_title:
    "嵐にあいました — クルーをほぞんできませんでした",
  onboarding_save_retry: "もう一度ためす",

  // S1 (R4) — Onboarding copy refinements (F10 3.1 / 3.3 / 3.4 / 3.5 / 3.8)
  onboarding_child_name_hint:
    "ここで決めた名前が、お子さまのダッシュボードに表示されます。",
  onboarding_job_yen_tip: "ヒント: ちいさいクルーは ¥50〜¥300 がめやすです。",
  onboarding_add_sibling: "+ きょうだいを追加",
  onboarding_sibling_unlock_hint:
    "2人以上ふやすと、きょうだいランキングがひらきます。",
  auth_env_missing_subtitle:
    "アカウントの読み込みでつまずいています。少しまってからもう一度ためすか、船長に設定を確認してもらってください。",

  // S3 (R4) — Kid dashboard polish (F10 6.3 / 6.5)
  kanban_empty_today_action: "🦜 もっとやりたいときは、おとなにつたえよう!",
  weekly_tracker_zero_hint:
    "おしごとをやって、たからばこを いっぱいにしよう! 🪙",

  // S5 (R4) — GoalWishlist collapse toggle (F10 6.6).
  goal_new_toggle_open: "+ ほかのもほしい!",
  goal_new_toggle_close: "✕ あとでね",

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
  // H3 — friendlier loading state during convexUser provisioning race.
  home_loading_crew: "クルーをよみこみ中…",

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
  job_library_empty_hint:
    "「+ 新しいお仕事」をタップして最初のおしごとを追加すると、子どものリストに出てきます。",
  job_library_empty_cta: "+ 最初のおしごとを追加",
  // F18 (resolves F11 CMO-review): parent surface — keep the celebratory tone but
  // pair it with parent-actionable framing rather than 「みんなえらい」kid-voice alone.
  approvals_empty_title: "全部おわっています! 船長、おつかれさま。",
  approvals_empty_hint:
    "子どもがおしごとをおわらせると、ここにしょうにん待ちで出てきます。",
  quick_add_empty_title: "今日のクイック追加はありません",
  quick_add_empty_hint:
    "上のおしごとをタップして今日に追加するか、よていタブで一週間ぶんを計画してください。",
  quick_add_empty_jobs_title: "おしごとライブラリはまだからっぽです",
  child_manager_no_kids: "まだクルーがいません",
  child_manager_no_kids_hint: "最初のおこさまを追加して、冒険をはじめよう。",
  planner_empty_title: "計画するクルーがいません",
  planner_empty_hint:
    "クルータブで子どもを1人以上追加してから、ここに戻ってきてください。",
  planner_no_jobs_title: "おしごとライブラリがからっぽ",
  // F18 (resolves F11 CMO-review): drop the「チョア」loanword — おしごと is the
  // canonical app term and matches every other planner/kanban string.
  planner_no_jobs_hint:
    "おしごとタブでおしごとを追加すると、ここにドラッグできるようになります。",
  planner_week_empty_banner:
    "今週のよていはまだありません — おしごとを曜日にドラッグするか、「月曜をテンプレートにする」をタップしてください。",

  // F11 — Empty states (kid dashboard) — kid-readable hiragana
  kanban_empty_today_title: "きょうのおしごとなし!",
  kanban_empty_today_hint:
    "あしたまたみてみよう。もっとやりたいときは船長にきいてね。",
  goals_empty_title: "ゴールはまだないよ",
  goals_empty_hint: "なにかほしいものをえらんでね!",
  history_empty_title: "たからものれきしはまだからっぽ",
  history_empty_hint:
    "おしごとをひとつおわらせるとここにでてくるよ — がんばれ!",
  // S3 (R4) — F10 6.9: warmer tone — passive "your captain hasn't planned
  // yet" rather than active "go nag them".
  upcoming_empty_title: "まだよていなし",
  upcoming_empty_hint:
    "船長は まだのこりのしゅうを きめてないみたい — ちょっとまっててね!",
  sibling_rank_solo_title: "いまはきみだけ!",
  sibling_rank_solo_hint:
    "もうひとりクルーがふえると、だれがいちばんかみえるよ。",

  // F12 — Mapped error messages (mapConvexError)
  // F18 (resolves F12 CMO-review): parent surface needs slightly tighter register
  // without going into 敬語 — drop 「ちゃった」filler and use plain 「が切れました」
  // which is informative without being cold.
  error_auth_lost: "ログインが切れました。もう一度ログインしてください。",
  error_network:
    "船とつながらないよ。インターネットをかくにんしてもう一度ためしてね。",
  error_overdraft: "そのつぼには、引き出すぶんのたからものがたりません。",
  error_lucky_chest_locked:
    "今週はもうラッキーチェストをあけたよ。月曜にまたためしてね!",
  error_child_deleted: "そのクルーはもう乗っていません。ページを更新します。",
  error_already_approved:
    "このおしごとはもう承認ずみです。取り消しはいりません。",
  error_ownership: "それはあなたのクルーのものではありません。",
  error_validation:
    "入力内容にきになるところがあります。確認してもう一度送ってね。",
  error_unknown: "なにかつまずいたみたい。もう一度ためしてね。",

  // F12 — Error / not-found pages (pirate-toned bilingual)
  // F18 (downgrades F12 CMO-review → L2-review): playful kid-friendly framing.
  // Parents may find it juvenile in a serious error context — a native L2-fluent
  // reader should sanity-check whether it lands warm or annoying.
  error_page_title: "あれ、ちずをみうしなった!",
  error_page_subtitle:
    "だいじょうぶ、たからものはぶじだよ。下のボタンでもう一度ためしてね。",
  error_page_cta: "もう一度",
  not_found_page_title: "この地図にはなにもないよ!",
  not_found_page_subtitle:
    "そのページが見つかりませんでした。安全なところに戻りましょう。",
  not_found_page_cta: "ホームへもどる",

  // F12 — Photo upload retry
  photo_proof_retry: "もう一度アップロード",

  // F12 — Destructive confirmation dialogs (child)
  child_delete_confirm_title: "{{name}}を削除しますか?",
  child_delete_confirm_body:
    "つぼ・れきし・よていされたおしごとがすべて消えます。元にはもどせません。",
  child_delete_confirm_cta: "はい、クルーを削除する",
  child_delete_confirm_cancel: "そのままにする",

  // F12 — Destructive confirmation dialogs (job)
  job_delete_confirm_title: "このおしごとを削除しますか?",
  job_delete_confirm_body:
    "よていされたインスタンスは削除されます。承認ずみのれきしは残ります。元にはもどせません。",
  job_delete_confirm_cta: "はい、削除する",
  job_delete_confirm_cancel: "そのままにする",

  // F12 — ChildManager i18n cleanup
  // F18 (resolves F12 CMO-review): standard parent UI header — no change needed.
  child_manager_header: "クルーメンバー ({{count}})",
  child_manager_add_btn: "+ クルーを追加",
  child_manager_empty_title: "まだクルーがいません!",
  child_manager_empty_subtitle:
    "最初のちいさな海賊を追加して、冒険をはじめよう。",
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

  // H4 — Empty-state CTAs (parent dashboard) + recovery / diagnostic micro-copy
  quick_add_go_to_children: "クルータブへ移動",
  week_planner_go_to_children: "クルータブへ移動",
  kid_back_home: "← ホームへもどる",
  error_digest_label: "エラーID:",

  // Wave 2 — segment-specific error boundaries (/parent + /kid/[childId]).
  // Mirrors `error_page_*` tone — playful + reassuring, JA-fluent should
  // still sanity-check that the parent strings land warm vs. juvenile.
  error_segment_parent_title: "船長の命令が止まった!",
  error_segment_parent_subtitle:
    "承認が送られませんでした。もう一度ためすか、つながりをかくにんしてね。",
  error_segment_parent_retry: "もう一度",
  error_segment_parent_home: "承認に戻る",
  error_segment_kid_title: "あ、危ない!",
  error_segment_kid_subtitle:
    "なにかおかしいね。もう一度ためすか、ほかのお友達をえらんでね。",
  error_segment_kid_retry: "もう一度",
  error_segment_kid_home: "お友達をえらぶ",

  // ===========================================================================
  // Wave 5 — /landing route (F10 1.1 EN+JA routing, 1.2 JP trust signals,
  // 1.3 hero "tracking only" disclaimer). Adult-facing surface — kanji is fine,
  // tone is warm, family-focused, simple. Mirrors lewis-voice register.
  // ===========================================================================
  landing_brand: "Pirate Money",

  // Nav + footer chrome
  landing_nav_sign_in: "ログイン",
  landing_nav_get_started: "はじめる",
  landing_footer_sign_up: "新規登録",
  landing_footer_made_by: "Mottodigital が制作",

  // Hero
  landing_hero_title_lead: "おてつだいを",
  landing_hero_title_highlight: "宝物に",
  landing_hero_subtitle:
    "おうちのお手伝いで、子どもがおこづかいをかせげます。子どもには楽しく、親御さんには簡単に、家族みんなで使えるアプリです。",
  // F10 1.3: hero disclaimer — track only, parents pay out real cash.
  landing_hero_disclaimer: "お金は親御さんがお渡しします。アプリは記録だけ。",
  landing_hero_cta_primary: "無料ではじめる",
  landing_hero_cta_secondary: "使い方を見る",

  // Hero trust signals — F10 1.2: privacy-focused, not freemium.
  landing_trust_privacy:
    "ご家族のデータはご家族のもの。広告も、トラッキングも、第三者への提供もありません",
  landing_trust_no_card: "クレジットカード不要",
  landing_trust_quick_setup: "2分でセットアップ",

  // Stats strip
  landing_stats_chores: "20以上のお手伝い",
  landing_stats_bilingual: "English & 日本語",
  landing_stats_yen: "円でしっかり記録",
  landing_stats_realtime: "リアルタイム更新",

  // How It Works
  landing_how_eyebrow: "ステップは3つだけ",
  landing_how_title: "使い方",
  landing_how_step1_title: "親御さんが計画",
  landing_how_step1_desc:
    "お手伝いをつくって、金額を決めて、お子さんごとに1週間の予定を立てます。",
  landing_how_step2_title: "お子さんが完了",
  landing_how_step2_desc:
    "お子さんは自分のミッションボードで今日のお仕事を見て、完了をつけます。",
  landing_how_step3_title: "承認しておこづかい",
  landing_how_step3_desc:
    "親御さんが内容を確認して承認すれば、おこづかいが加算されます。",

  // Parent showcase
  landing_parent_eyebrow: "親御さんへ",
  landing_parent_title: "1週間の予定を数秒で",
  landing_parent_body:
    "お子さんごとにお手伝いを割り当てて、金額を決めて、1週間の予定をまとめて作れます。お子さんが完了したら、ワンタップで承認できます。",
  landing_parent_bullet_planner: "ドラッグ&ドロップの週間プランナー",
  landing_parent_bullet_yen: "お手伝いごとに金額を自由に設定",
  landing_parent_bullet_approve: "承認、または「やり直し」で送り返す",
  landing_parent_bullet_lock: "計算問題ロックで、お子さんは入れません",

  // Parent mockup phone-frame
  landing_mock_parent_header_eyebrow: "船長のデッキ",
  landing_mock_parent_header_title: "週間プランナー",
  landing_mock_day_mon: "月",
  landing_mock_day_tue: "火",
  landing_mock_day_wed: "水",
  landing_mock_day_thu: "木",
  landing_mock_day_fri: "金",
  landing_mock_parent_bobbys_week: "ボビーの1週間",
  landing_mock_parent_approve_label: "承認 (2)",
  landing_mock_parent_job1_title: "おもちゃを片付け",
  landing_mock_parent_job1_child: "ボビー",
  landing_mock_parent_job2_title: "お花に水やり",
  landing_mock_parent_job2_child: "サラ",

  // Kid showcase
  landing_kid_eyebrow: "お子さんへ",
  landing_kid_title: "じぶんのミッションボード",
  landing_kid_body:
    "きょうのおしごとを見て、「やってる」にうごかして、おわったら「できた」にしよう。1しゅうかんでどれだけかせげたか、ばっちりわかるよ。ぜんぶおわらせるとイルカのおいわい!",
  landing_kid_bullet_board: "たのしいドラッグ&ドロップのボード",
  landing_kid_bullet_tracker: "1しゅうかんのかせぎがひとめでわかる",
  landing_kid_bullet_celebration: "おいわいのアニメーション",
  landing_kid_bullet_avatar: "すきな海の生き物アバターをえらべる",

  // Kid mockup phone-frame
  landing_mock_kid_header: "ボビーのおしごと",
  landing_mock_kid_this_week: "こんしゅう",
  landing_mock_kid_todo: "やること",
  landing_mock_kid_doing: "やってる",
  landing_mock_kid_done: "できた",
  landing_mock_kid_surprise: "ぜんぶおわらせるとサプライズ!",

  // Features grid
  landing_feat_eyebrow: "機能",
  landing_feat_title: "家族に必要なものぜんぶ",
  landing_feat_planner_title: "週間プランナー",
  landing_feat_planner_desc:
    "お子さんごとに、曜日ごとにお手伝いを割り当てられます。",
  landing_feat_approval_title: "承認システム",
  landing_feat_approval_desc:
    "親御さんが確認・承認してから、おこづかいに加算されます。",
  landing_feat_tracker_title: "かせぎトラッカー",
  landing_feat_tracker_desc:
    "お子さんは1週間のしんちょくバーがリアルタイムで増えていくのを見られます。",
  landing_feat_kidui_title: "子ども向けデザイン",
  landing_feat_kidui_desc:
    "お子さんが本当に楽しめる、たのしいかんばんボードです。",
  landing_feat_bilingual_title: "バイリンガル",
  landing_feat_bilingual_desc:
    "日本語と英語にフル対応。ワンタップで切り替えられます。",
  landing_feat_lock_title: "親御さんロック",
  landing_feat_lock_desc:
    "計算問題ロックで、親御さんのダッシュボードを守ります。",

  // Chore preview
  landing_chores_eyebrow: "すぐ使える",
  landing_chores_title: "20以上のお手伝い",
  landing_chores_body:
    "選びぬいたお手伝いライブラリから始めても、自分でつくってもOK。",
  landing_chores_more: "+ オリジナルのお手伝い、単発タスクなど",
  landing_chore_fold: "洗濯物をたたむ",
  landing_chore_toys: "おもちゃを片付ける",
  landing_chore_bed: "ベッドメイキング",
  landing_chore_water: "お花に水やり",
  landing_chore_pets: "ペットにごはん",
  landing_chore_books: "本を片付ける",
  landing_chore_sweep: "ゆかをはく",
  landing_chore_windows: "窓をふく",
  landing_chore_table: "テーブルをセット",
  landing_chore_bag: "学校のかばんを準備",
  landing_chore_teeth: "歯みがき",
  landing_chore_cook: "料理のおてつだい",

  // Final CTA
  landing_final_title_lead: "おてつだいを",
  landing_final_title_highlight: "冒険にしませんか?",
  landing_final_body:
    "無料で使えます。2分でセットアップ。クレジットカードは不要です。",
  landing_final_cta: "家族の冒険をはじめる",
} as const;

export default ja;
