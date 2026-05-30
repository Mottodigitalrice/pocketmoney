const en = {
  // App
  app_name: "Pirate Money",
  app_title: "Pirate Money | Earn Yen!",
  app_description: "Earn Yen by helping around the house!",

  // Home page
  home_who_are_you: "Who are you?",
  home_parent_name: "Mummy & Daddy",
  home_parent_subtitle: "The Pirate Crew",
  home_jayden_subtitle: "Great White Shark - Age 7",
  home_tyler_subtitle: "Dolphin - Age 4",

  // Error pages
  error_title: "Something went wrong",
  error_description: "An unexpected error occurred. Please try again.",
  error_retry: "Try again",
  not_found_title: "Page not found",
  not_found_description:
    "The page you're looking for doesn't exist or has been moved.",
  not_found_go_home: "Go home",

  // Kid
  kid_invalid_child: "Who are you? 🤔",
  kid_loading: "Loading...",
  kid_home: "Home",
  kid_header_jobs: "{{name}}'s Jobs",
  kid_header_shark: "Great White Shark",
  kid_header_dolphin: "Dolphin",
  kid_header_age: "Age {{age}}",
  kid_upcoming_title: "Still Coming This Week",
  kid_upcoming_empty: "No more jobs planned for this week yet.",
  kid_history_title: "Treasure History",
  kid_history_this_week: "This Week",
  kid_history_prev_week: "Previous Week",
  kid_history_next_week: "Next Week",
  kid_history_empty: "No treasure earned this week yet.",
  kid_history_jobs: "{{count}} job(s)",

  // Weekly tracker
  weekly_treasure_title: "This Week's Treasure",
  weekly_progress: "¥{{earned}} of ¥{{total}} possible",
  treasure_grand_total: "Grand Treasure",
  treasure_this_week: "This Week",

  // Treasure chest
  treasure_your_treasure: "Your Treasure",
  treasure_tap_to_close: "Tap anywhere to close",

  // Kanban
  kanban_columns_label: "Job board columns",
  kanban_available: "Available Jobs",
  kanban_doing: "I'm Doing It!",
  kanban_done: "Done!",
  kanban_empty_available: "All jobs taken!",
  kanban_empty_doing: "Pick a job to start!",
  kanban_empty_done: "Complete jobs to see them here!",

  // Job card
  job_start: "Let's Do It! 💪",
  job_complete: "I Did It! ✅",
  job_waiting: "Waiting for Mummy or Daddy",
  job_try_again_note: "Mum/Dad sent it back - here's what to fix: {{note}}",

  // Celebration
  celebration_great_job: "GREAT JOB!",
  celebration_waiting: "Waiting for Mummy or Daddy to check",

  // Parent tabs
  tab_navigation_label: "Parent dashboard sections",
  tab_quick_add: "Quick Add ⚡",
  tab_approvals: "Approvals ✅",
  tab_planner: "Planner 📅",
  tab_jobs: "Jobs 📜",
  tab_overview: "Overview 👀",

  // Parent header
  parent_home: "Home",
  parent_header_title: "Captain's Bridge",
  parent_header_subtitle: "Mummy & Daddy's Command Center",
  parent_captain_code: "Captain's Code",
  parent_captain_code_on: "On",
  parent_captain_code_off: "Off",

  // Approval queue
  approval_all_clear: "All clear, Captain!",
  approval_no_jobs: "No jobs waiting for approval",
  approval_waiting_title: "Waiting for Approval ({{count}})",

  // Approval card
  approval_approve: "Approve ✅",
  approval_reject: "Try Again 🔄",
  approval_reject_note_prompt: "What should they fix before trying again?",
  // S6 (R4) — F10 5.17: styled reject-note dialog replaces window.prompt.
  approval_reject_dialog_title: "Send back for a do-over",
  approval_reject_dialog_subtitle:
    "Leave a kind note so they know what to fix.",
  approval_reject_dialog_placeholder:
    "e.g. The bed still has socks under the pillow!",
  approval_reject_dialog_cancel: "Cancel",
  approval_reject_dialog_submit: "Send Back",
  approval_reject_dialog_empty_error:
    "Please write a quick note before sending it back.",
  approval_photo_proof: "Photo proof",
  approval_photo_proof_alt: "Photo proof for completed job",
  // F20 — tap-to-enlarge + close labels for the proof preview modal.
  approval_photo_tap_to_enlarge: "Tap to enlarge",
  approval_photo_preview_close: "Close",
  // F20 — JobManager row icon button aria-labels (was title-only).
  job_manager_edit_aria: "Edit job",
  job_manager_delete_aria: "Delete job",
  // F20 — WeekPlanner mobile day-picker labels.
  planner_day_picker_label: "Pick a day",
  planner_view_mode_grid: "Grid",
  planner_view_mode_day: "Day",

  // Job manager
  job_manager_title: "Job Library ({{count}})",
  job_manager_new: "+ New Job",
  job_manager_quick_assign: "Assign Today",
  job_manager_choose_child: "Choose who",
  job_manager_photo_proof: "Photo proof required",
  // S2 (R4) — F10 5.10: disabled-state aria-label when no kids exist.
  job_manager_quick_assign_no_kids_aria:
    "Add a crew member before assigning a job",

  // Job form
  job_form_edit_title: "Edit Job",
  job_form_add_title: "Add New Job",
  job_form_name_label: "Job Name",
  job_form_name_placeholder: "e.g. Clean up toys",
  job_form_icon_label: "Icon",
  job_form_yen_label: "Yen Amount (¥)",
  job_form_recurrence_label: "Repeats",
  job_form_photo_proof_label: "Require photo proof",
  job_form_photo_proof_hint:
    "Kids must upload a photo before this job can be sent for approval.",
  job_form_cancel: "Cancel",
  job_form_save: "Save Changes",
  job_form_add: "Add Job",

  // Week planner
  planner_title: "Week Planner",
  planner_this_week: "This Week",
  planner_next_week: "Next Week",
  planner_prev_week: "Previous Week",
  planner_today: "Today",
  planner_tap_to_add: "Tap to add jobs",
  planner_add_jobs: "Add Jobs",
  planner_no_children: "Add crew members first!",
  planner_empty_day: "No jobs",
  planner_clear_day: "Clear Day",
  planner_bulk_job: "Job to assign",
  planner_bulk_children: "Assign to",
  planner_priority: "Priority",
  planner_priority_optional: "Optional",
  planner_priority_must: "Must do",
  planner_all_children_selected: "All crew selected",
  planner_selected_children: "{{count}} selected",
  planner_copy_last_week: "Copy last week",
  planner_apply_monday: "Apply Monday template",
  planner_apply_recurring: "Apply recurring jobs",
  planner_crew: "Crew",
  planner_add_selected: "Add selected",
  planner_remove_job: "Remove job",
  priority_must_do: "Must do",

  // Photo proof
  photo_proof_required: "Photo proof needed",
  photo_proof_choose: "Take or choose photo",
  photo_proof_chosen: "{{name}} selected",
  photo_proof_uploading: "Uploading...",
  photo_proof_error: "Could not upload the photo. Please try again.",

  // Recurrence
  recurrence_none: "No repeat",
  recurrence_daily: "Daily",
  recurrence_weekdays: "Weekdays",
  recurrence_specificDays: "Specific days",
  recurrence_day_0: "Mon",
  recurrence_day_1: "Tue",
  recurrence_day_2: "Wed",
  recurrence_day_3: "Thu",
  recurrence_day_4: "Fri",
  recurrence_day_5: "Sat",
  recurrence_day_6: "Sun",

  // Quick assign
  quick_assign_title: "Assign Today",
  quick_assign_who: "Assign to",

  // Quick add today
  quick_add_title: "Quick Add Today",
  quick_add_subtitle:
    "Tap a job, pick who it's for, and add it to today in a couple of taps.",
  quick_add_empty_jobs: "Add some jobs to your library first.",
  quick_add_empty_children: "Add your crew first before assigning jobs.",
  quick_add_choose_who: "Who is this for?",
  quick_add_preapprove: "Pre-approve and pay now",
  quick_add_preapprove_hint:
    "Skips the kid list and approval queue, and adds the treasure straight away.",
  quick_add_confirm: "Add Jobs",
  quick_add_assigning: "Adding...",

  // One-off task
  oneoff_title: "Quick Task",
  oneoff_subtitle: "One-time job, won't be saved to your library",
  oneoff_name_placeholder: "e.g. Clean up that mess",
  oneoff_assign_to: "Assign to",
  oneoff_create: "Create & Assign",

  // Kanban (updated)
  kanban_no_jobs_today: "No jobs scheduled for today!",
  kanban_no_jobs_hint: "Ask Mummy or Daddy to add some!",

  // Child overview
  overview_earned: "Earned",
  overview_possible: "Possible",
  overview_in_progress: "In Progress",
  overview_completed: "Completed",
  overview_waiting: "⏳ {{count}} job(s) waiting for approval",

  // Wallet
  wallet_spend: "Spend",
  wallet_save: "Save",
  wallet_give: "Give",
  wallet_total: "Total Treasure",

  // Withdrawals
  withdraw_open: "Withdraw",
  withdrawal_open_for: "Withdraw from {{name}}'s wallet",
  withdraw_title: "Withdraw from {{name}}",
  withdraw_jar: "Jar",
  withdraw_amount: "Amount",
  withdraw_available: "Available",
  withdraw_reason: "Reason",
  withdraw_reason_cashOut: "Cash out",
  withdraw_reason_penalty: "Penalty",
  withdraw_reason_correction: "Correction",
  withdraw_reason_other: "Other",
  withdrawal_reason_penalty_kid: "Adjustment",
  withdraw_note: "Note",
  withdraw_note_placeholder: "What was this for?",
  withdraw_submit: "Record Withdrawal",
  withdraw_saving: "Recording...",
  withdraw_error_amount: "Enter an amount above ¥0.",
  withdraw_error_balance: "That jar does not have enough treasure.",
  withdraw_error_note: "Add a note when the reason is Other.",
  withdraw_error_generic: "Could not record the withdrawal.",
  // S4 (R4) — F10 5.16: inline max-amount hint + one-tap "Use max" pill.
  withdraw_max_helper: "Max ¥{{max}}",
  withdraw_use_max: "Use max",

  // Bonuses
  bonus_open: "Bonus",
  bonus_open_for: "Award bonus to {{name}}",
  bonus_title: "Bonus for {{name}}",
  bonus_amount: "Amount",
  bonus_note: "Reason",
  bonus_note_placeholder: "What did they do well?",
  bonus_split_hint:
    "Bonus treasure is split into Spend / Save / Give using 70 / 20 / 10.",
  bonus_submit: "Award Bonus",
  bonus_saving: "Awarding...",
  bonus_error_amount: "Enter an amount above ¥0.",
  bonus_error_generic: "Could not award the bonus.",

  // Lucky Chest
  lucky_chest_title: "Lucky Chest",
  lucky_chest_sleeping_title: "The chest is sleeping this week",
  lucky_chest_sleeping_hint:
    "Add some must-do jobs and it'll wake up next week!",
  lucky_chest_locked: "{{done}} / {{total}} must-do jobs approved this week.",
  lucky_chest_unlocked: "Unlocked! Open it for up to ¥{{amount}}.",
  lucky_chest_opened: "Opened this week: ¥{{amount}} added to your treasure.",
  lucky_chest_open: "Open Chest",
  lucky_chest_opening: "Opening...",
  lucky_chest_error: "Could not open the chest.",
  lucky_chest_parent_title: "Lucky Chest",
  lucky_chest_parent_subtitle:
    "Kids can open it once per week after all must-do jobs are approved.",
  lucky_chest_max_label: "Max ¥",
  lucky_chest_save: "Save",
  // S2 (R4) — F10 5.19: surface the Monday-roll schedule + amount range.
  lucky_chest_schedule_explainer:
    "Each Monday, every kid who finished must-do chores rolls between ¥10 and ¥{{max}}.",

  // Goals
  goal_title: "Save Goal",
  goal_subtitle: "Your Save jar goes toward the thing you want next.",
  goal_empty: "No save goal yet",
  goal_empty_subtitle:
    "Pick something you want and start filling the Save jar.",
  goal_save_balance: "Save jar: ¥{{amount}}",
  goal_funded: "funded",
  goal_ready: "Ready!",
  goal_remaining: "¥{{amount}} to go",
  goal_name_placeholder: "What are you saving for?",
  goal_amount_placeholder: "¥ goal",
  goal_create: "Set Goal",
  goal_saving: "Saving...",
  goal_error_title: "Name your goal first.",
  goal_error_amount: "Enter a goal amount above ¥0.",
  goal_error_generic: "Could not save the goal.",
  goal_swap_reassurance:
    "Your ¥{{amount}} is still saved. It will now go toward {{name}}.",
  goal_big_dream_hint:
    "Big dream! Keep saving - every week your Save jar grows.",

  // Ranks
  rank_board_title: "Crew Ranks",
  rank_current: "Current rank",
  rank_score: "{{score}} rank points",
  rank_next: "Next: {{rank}} at {{score}}",
  rank_max: "Top rank reached",
  rank_up_toast_title: "You leveled up!",
  rank_up_toast_body: "Welcome, {{rank}} pirate!",
  // G5: private kudos line — compares THIS WEEK vs THIS CHILD's rolling
  // 4-week average. Never shown against siblings; self-vs-self only.
  rank_kudos_above_avg:
    "You earned ¥{{amount}} this week — that's {{percent}}% above your usual! Keep going!",
  rank_kudos_at_avg:
    "You earned ¥{{amount}} this week — right on your usual pace.",
  rank_kudos_below_avg:
    "You earned ¥{{amount}} this week. Your usual pace is higher — small steps add up!",
  rank_toggle_lifetime: "All time",
  rank_toggle_weekly: "This week",

  // Job titles
  job_fold_washing: "Fold the washing",
  job_clean_toys: "Clean up toys",
  job_make_bed: "Make the bed",
  job_set_table: "Set the table",
  job_water_plants: "Water the plants",
  job_put_shoes_away: "Put shoes away",
  job_feed_pets: "Feed the pets",
  job_dishes_sink: "Put dishes in the sink",
  job_pick_books: "Pick up books",
  job_wipe_table: "Wipe the table",
  job_dirty_clothes: "Dirty clothes in basket",
  job_tidy_room: "Tidy your room",
  job_setup_futon: "Help set up the futon",
  job_brush_teeth: "Brush teeth (no asking!)",
  job_pack_school_bag: "Pack school bag",
  job_put_away_groceries: "Put away groceries",
  job_sweep_floor: "Sweep the floor",
  job_wipe_windows: "Wipe windows",
  job_sort_recycling: "Sort the recycling",
  job_help_cook: "Help cook dinner",

  // Onboarding
  onboarding_welcome: "Welcome to Pirate Money!",
  onboarding_welcome_subtitle:
    "Ahoy, Captain! Ready to set sail on a treasure-filled adventure? Let's get your crew together and start earning some booty!",
  onboarding_get_started: "Get Started",
  onboarding_add_crew: "Who's in your crew?",
  onboarding_add_crew_subtitle:
    "Add your little pirates below. You can add up to 6 crew members.",
  onboarding_child_name: "Crew member's name",
  onboarding_choose_icon: "Choose their sea creature",
  onboarding_add_another: "+ Add Another Crew Member",
  onboarding_remove_child: "Remove",
  onboarding_next: "Next",
  onboarding_back: "Back",
  onboarding_all_done: "All Hands on Deck!",
  onboarding_all_done_subtitle: "Your crew is ready to set sail!",
  onboarding_your_crew: "Your crew",
  onboarding_start_adventure: "Start Your Adventure!",
  onboarding_saving: "Setting sail...",
  onboarding_at_least_one: "Add at least one crew member",
  onboarding_step: "Step {{current}} of {{total}}",

  // Onboarding - Jobs step
  onboarding_add_jobs: "Set Up Some Jobs",
  onboarding_add_jobs_subtitle:
    "What chores can your crew do to earn treasure? Add your own, or skip and we'll start you with 20 built-in chores.",
  onboarding_job_name: "Job name",
  onboarding_job_name_placeholder: "e.g. Clean up toys",
  onboarding_job_yen: "Yen (¥)",
  onboarding_add_job: "+ Add Another Job",
  onboarding_remove_job: "Remove",
  // H3 — skip-jobs path: empty custom list is fine, defaults always seed.
  onboarding_use_defaults_only:
    "Or skip this and we'll set up 20 starter chores for you",

  // H3 — onboarding save error UX (mapped from mapConvexError + retry affordance)
  onboarding_save_failed_title: "We hit a squall — couldn't save your crew",
  onboarding_save_retry: "Try again",

  // S1 (R4) — Onboarding copy refinements (F10 3.1 / 3.3 / 3.4 / 3.5 / 3.8)
  onboarding_child_name_hint:
    "This is the name your kid will see on their dashboard.",
  onboarding_job_yen_tip:
    "Tip: ¥50–¥300 per chore is typical for younger crew.",
  onboarding_add_sibling: "+ Add a Sibling",
  onboarding_sibling_unlock_hint:
    "Add 2+ kids to unlock the sibling leaderboard.",
  auth_env_missing_subtitle:
    "We're having trouble loading your account. Try again in a moment, or ask the captain to check the setup.",

  // S3 (R4) — Kid dashboard polish (F10 6.3 / 6.5)
  kanban_empty_today_action: "🦜 Tell a grown-up if you want more!",
  weekly_tracker_zero_hint: "Do your chores to fill the chest! 🪙",

  // S5 (R4) — GoalWishlist collapse toggle (F10 6.6).
  goal_new_toggle_open: "+ I want something else!",
  goal_new_toggle_close: "✕ Maybe later",

  // Math challenge (parent gate)
  math_challenge_title: "Captain's Code",
  math_challenge_subtitle: "Solve to enter the bridge!",
  math_challenge_placeholder: "Your answer",
  math_challenge_submit: "Enter",
  math_challenge_wrong: "Not quite! Try again, Captain.",
  math_challenge_hint: "Only the Captain can enter!",

  // Child management
  children_title: "Crew Members",
  children_add: "+ Add Crew Member",
  children_empty: "No crew members yet!",
  children_empty_subtitle: "Add your first little pirate.",
  children_form_add_title: "Add Crew Member",
  children_form_edit_title: "Edit Crew Member",
  children_form_name_label: "Name",
  children_form_name_placeholder: "e.g. Jayden",
  children_form_icon_label: "Choose an Icon",
  children_form_save: "Save",
  children_form_cancel: "Cancel",
  children_delete_confirm: "Remove this crew member?",

  // Parent tabs (updated)
  tab_children: "Crew \u{1F465}",

  // Home page (updated for dynamic)
  home_add_children_hint: "Add your crew in the Captain's Bridge!",
  home_no_children: "No crew members yet",
  // H3 — friendlier loading state during convexUser provisioning race.
  home_loading_crew: "Loading your crew…",
  // Shown when Clerk sign-in succeeded but the Convex user row could not be
  // created after retries (e.g. broken Clerk→Convex auth handshake).
  home_provisioning_error_title: "Couldn't board the ship",
  home_provisioning_error_body:
    "You're signed in, but we couldn't load your crew. This is usually a quick hiccup — give it another go.",
  home_provisioning_error_retry: "Try Again",
  home_provisioning_error_logout: "Log out & try a different account",

  // Auth
  auth_sign_in_title: "Welcome Back, Captain!",
  auth_sign_in_subtitle: "Enter the ship",
  auth_sign_up_title: "Join the Crew!",
  auth_sign_up_subtitle: "Start your treasure adventure",
  auth_logout: "Log Out",

  // F11 — Empty states (parent dashboard)
  job_library_empty_title: "No chores in your library yet",
  job_library_empty_hint:
    "Tap + New Job to add your first chore — the kids can't see anything until you do.",
  job_library_empty_cta: "+ Add Your First Job",
  approvals_empty_title: "Nothing waiting — kids are caught up!",
  approvals_empty_hint: "Finished chores will show up here for you to review.",
  // Wave 7 — F10 5.3: distinguish first-day vs recurring caught-up. The legacy
  // `approvals_empty_*` keys above stay for callers that haven't migrated yet;
  // ApprovalQueue itself now branches on `hasEverHadApprovedInstance`.
  approval_queue_first_day_title: "Ready for your crew's first job?",
  approval_queue_first_day_body:
    "Approved jobs will appear here. Add a job + assign it to a kid to get started.",
  approval_queue_caught_up_title: "All caught up!",
  approval_queue_caught_up_body: "Check back when the crew finishes more jobs.",
  quick_add_empty_title: "No quick-add tasks today",
  quick_add_empty_hint:
    "Pick a chore above to add it to today, or use Planner for the rest of the week.",
  quick_add_empty_jobs_title: "No chores in your library yet",
  child_manager_no_kids: "No crew aboard yet",
  child_manager_no_kids_hint:
    "Add your first kid to get the adventure started.",
  planner_empty_title: "No crew to plan for",
  planner_empty_hint:
    "Add at least one kid in the Crew tab, then come back to plan the week.",
  planner_no_jobs_title: "Your job library is empty",
  planner_no_jobs_hint:
    "Add chores in the Jobs tab — they'll show up here to drag onto days.",
  planner_week_empty_banner:
    "No chores scheduled this week yet — drag a job onto a day or tap Apply Monday template.",

  // F11 — Empty states (kid dashboard)
  kanban_empty_today_title: "All done for today!",
  kanban_empty_today_hint:
    "Try checking back tomorrow — or ask a captain if you want more.",
  goals_empty_title: "No goal yet",
  goals_empty_hint: "Pick something cool to save for!",
  history_empty_title: "Your treasure log is empty",
  history_empty_hint: "Finish a chore and it'll show up here — keep going!",
  // Wave 7 — F10 6.7: zero-history shell renders the calendar GRID with an
  // overlay 🗺️ icon + warmer "your adventure starts here" copy. Replaces the
  // bare history_empty_* text-only state for the truly-empty case.
  treasure_history_empty_title: "Your treasure log starts here",
  treasure_history_empty_body:
    "Finish a job to mark your first day on the calendar.",
  // S3 (R4) — F10 6.9: warmer tone. Frames the empty state as "your captain
  // hasn't sailed there yet" instead of telling the kid to nag.
  upcoming_empty_title: "Nothing planned yet",
  upcoming_empty_hint:
    "Your captain hasn't charted the rest of the week — sit tight!",
  sibling_rank_solo_title: "Just you for now!",
  sibling_rank_solo_hint:
    "When another crew member joins, you'll see who's ahead.",

  // F12 — Mapped error messages (mapConvexError → human-readable strings)
  error_auth_lost: "You've been signed out — please log back in to keep going.",
  error_network:
    "We can't reach the ship right now. Check your connection and try again.",
  error_overdraft: "That jar doesn't have enough treasure for this withdrawal.",
  error_lucky_chest_locked:
    "You already opened the Lucky Chest this week — try again on Monday!",
  error_lucky_chest_cooldown: "Wait a moment — try again in a few seconds!",
  error_child_deleted:
    "That crew member is no longer aboard. The page will refresh.",
  error_already_approved:
    "This chore was already approved — no take-backs needed!",
  error_parent_note_too_long: "Note is too long. Keep it under 500 characters.",
  error_job_title_too_long:
    "Job title is too long. Keep it under 100 characters.",
  error_job_title_ja_too_long:
    "Japanese job title is too long. Keep it under 100 characters.",
  error_job_yen_amount_out_of_bounds:
    "Job amount must be between ¥0 and ¥1,000,000.",
  error_invalid_date_format:
    "Date format is invalid. Use YYYY-MM-DD (e.g., 2026-05-23).",
  error_ownership: "That doesn't belong to your crew.",
  error_validation:
    "Something in that form isn't quite right. Please check and try again.",
  error_unknown: "Something hit a reef. Please try again in a moment.",

  // F12 — Error / not-found pages (pirate-toned)
  error_page_title: "Something hit a reef!",
  error_page_subtitle:
    "Don't worry — your treasure is safe. Tap below to try again.",
  error_page_cta: "Try Again",
  not_found_page_title: "This map leads nowhere!",
  not_found_page_subtitle:
    "We couldn't find that page. Let's get you back to safe waters.",
  not_found_page_cta: "Back to Safe Harbour",

  // F12 — Photo upload retry
  photo_proof_retry: "Retry Upload",

  // F12 — Destructive confirmation dialogs (child)
  child_delete_confirm_title: "Delete {{name}}?",
  child_delete_confirm_body:
    "This removes their wallet, history, and all scheduled jobs. This cannot be undone.",
  child_delete_confirm_cta: "Yes, delete crew member",
  child_delete_confirm_cancel: "Keep them aboard",

  // F12 — Destructive confirmation dialogs (job)
  job_delete_confirm_title: "Delete this chore?",
  job_delete_confirm_body:
    "Any scheduled instances of this chore will be removed. Past completed history stays. This cannot be undone.",
  job_delete_confirm_cta: "Yes, delete chore",
  job_delete_confirm_cancel: "Keep it",

  // F12 — ChildManager i18n cleanup
  child_manager_header: "Crew Members ({{count}})",
  child_manager_add_btn: "+ Add Child",
  child_manager_empty_title: "No crew members yet!",
  child_manager_empty_subtitle: "Add your first little pirate to get started.",
  child_manager_empty_cta: "+ Add Crew Member",
  child_icon_fallback_label: "Fish",
  child_manager_delete_aria: "Delete {{name}}",
  child_manager_edit_aria: "Edit {{name}}",

  // F12 — ChildForm i18n cleanup
  child_form_edit_title: "Edit Crew Member",
  child_form_add_title: "Add Crew Member",
  child_form_name_label: "Name",
  child_form_name_placeholder: "Enter their name...",
  child_form_icon_label: "Choose an icon",
  child_form_cancel: "Cancel",
  child_form_save_edit: "Save Changes",
  child_form_save_add: "Add to Crew",

  // H4 — Empty-state CTAs (parent dashboard) + recovery / diagnostic micro-copy
  quick_add_go_to_children: "Go to the Crew tab",
  week_planner_go_to_children: "Go to the Crew tab",
  kid_back_home: "← Back home",
  error_digest_label: "Error ID:",

  // Wave 2 — segment-specific error boundaries (/parent + /kid/[childId]).
  // Same pirate tone as `error_page_*`, but copy is scoped to the segment so
  // the recovery CTA can route somewhere safer than a generic remount.
  error_segment_parent_title: "Captain's orders stalled!",
  error_segment_parent_subtitle:
    "Your approval didn't sail through. Try again or check your connection.",
  error_segment_parent_retry: "Try Again",
  error_segment_parent_home: "Back to Approvals",
  error_segment_kid_title: "Whoa there, sailor!",
  error_segment_kid_subtitle:
    "Something went wrong. Let's try again or go pick a different friend.",
  error_segment_kid_retry: "Try Again",
  error_segment_kid_home: "Pick a Friend",

  // Wave 8b — onboarding segment error boundary (/onboarding). Catches Convex
  // mutation failures inside the 4-step funnel — friendly warm copy, retry +
  // escape-to-home CTAs (home is safer than re-entering the broken funnel).
  error_onboarding_title: "The map slipped overboard!",
  error_onboarding_subtitle:
    "We hit a snag setting up your crew. Try again, or head home and we'll keep your spot.",
  error_onboarding_cta_retry: "Try Again",
  error_onboarding_cta_back: "Go Home",

  // ===========================================================================
  // Wave 5 — /landing route (F10 1.1 EN+JA routing, 1.2 JP trust signals,
  // 1.3 hero "tracking only" disclaimer). Keys are scoped `landing_*` so we
  // never collide with in-app surface copy.
  // ===========================================================================
  landing_brand: "Pirate Money",

  // Nav + footer chrome
  landing_nav_sign_in: "Sign In",
  landing_nav_get_started: "Get Started",
  landing_footer_sign_up: "Sign Up",
  landing_footer_made_by: "Made by Mottodigital",

  // Hero
  landing_hero_title_lead: "Turn Chores Into",
  landing_hero_title_highlight: "Treasure",
  landing_hero_subtitle:
    "Kids earn real pocket money by completing household jobs. Fun for kids, easy for parents, great for the whole family.",
  // F10 1.3: clarify the app records balances, the parent pays out real cash.
  landing_hero_disclaimer: "We track the numbers — you pay out the real coins.",
  landing_hero_cta_primary: "Get Started Free",
  landing_hero_cta_secondary: "See How It Works",

  // Hero trust signals — F10 1.2: privacy-focused, not freemium.
  landing_trust_privacy:
    "Your family's data stays in your family — no ads, no tracking",
  landing_trust_no_card: "No credit card needed",
  landing_trust_quick_setup: "Set up in 2 minutes",

  // Stats strip
  landing_stats_chores: "20+ Built-in Chores",
  landing_stats_bilingual: "English & 日本語",
  landing_stats_yen: "Real Yen Tracking",
  landing_stats_realtime: "Real-Time Updates",

  // How It Works
  landing_how_eyebrow: "Simple as 1-2-3",
  landing_how_title: "How It Works",
  landing_how_step1_title: "Parents Plan",
  landing_how_step1_desc:
    "Create chores, set yen amounts, and schedule the week for each child.",
  landing_how_step2_title: "Kids Complete",
  landing_how_step2_desc:
    "Kids see their jobs on a fun mission board and mark them done.",
  landing_how_step3_title: "Approve & Earn",
  landing_how_step3_desc:
    "Parents review the work, approve it, and pocket money is earned.",

  // Parent showcase
  landing_parent_eyebrow: "For Parents",
  landing_parent_title: "Plan the week in seconds",
  landing_parent_body:
    "Assign chores to each child, set yen amounts, and schedule the entire week. When kids finish their jobs, review and approve with a single tap.",
  landing_parent_bullet_planner: "Drag-and-drop week planner",
  landing_parent_bullet_yen: "Custom yen amounts per chore",
  landing_parent_bullet_approve: "Approve or send back for redo",
  landing_parent_bullet_lock: "Math challenge keeps kids out",

  // Parent mockup phone-frame
  landing_mock_parent_header_eyebrow: "Captain's Deck",
  landing_mock_parent_header_title: "Week Planner",
  landing_mock_day_mon: "Mon",
  landing_mock_day_tue: "Tue",
  landing_mock_day_wed: "Wed",
  landing_mock_day_thu: "Thu",
  landing_mock_day_fri: "Fri",
  landing_mock_parent_bobbys_week: "Bobby's Week",
  landing_mock_parent_approve_label: "Approve (2)",
  landing_mock_parent_job1_title: "Clean up toys",
  landing_mock_parent_job1_child: "Bobby",
  landing_mock_parent_job2_title: "Water plants",
  landing_mock_parent_job2_child: "Sarah",

  // Kid showcase
  landing_kid_eyebrow: "For Kids",
  landing_kid_title: "Your own mission board",
  landing_kid_body:
    'See today\'s jobs, drag them to "Doing", and mark them done. Watch your earnings grow all week. Complete everything for a dolphin celebration!',
  landing_kid_bullet_board: "Fun drag-and-drop job board",
  landing_kid_bullet_tracker: "Weekly earnings tracker",
  landing_kid_bullet_celebration: "Celebration animations",
  landing_kid_bullet_avatar: "Choose your own sea creature avatar",

  // Kid mockup phone-frame
  landing_mock_kid_header: "Bobby's Jobs",
  landing_mock_kid_this_week: "This week",
  landing_mock_kid_todo: "TO DO",
  landing_mock_kid_doing: "DOING",
  landing_mock_kid_done: "DONE",
  landing_mock_kid_surprise: "Complete all jobs for a surprise!",

  // Features grid
  landing_feat_eyebrow: "Features",
  landing_feat_title: "Everything your family needs",
  landing_feat_planner_title: "Weekly Planner",
  landing_feat_planner_desc:
    "Assign chores for each day of the week to each child.",
  landing_feat_approval_title: "Approval System",
  landing_feat_approval_desc:
    "Parents review and approve completed chores before they count.",
  landing_feat_tracker_title: "Earnings Tracker",
  landing_feat_tracker_desc:
    "Kids see their weekly progress bar filling up in real-time.",
  landing_feat_kidui_title: "Kid-Friendly UI",
  landing_feat_kidui_desc: "A fun kanban board that kids actually enjoy using.",
  landing_feat_bilingual_title: "Bilingual",
  landing_feat_bilingual_desc:
    "Full English and Japanese support — switch with one tap.",
  landing_feat_lock_title: "Parent Lock",
  landing_feat_lock_desc:
    "Math challenge keeps the parent dashboard safe from little hands.",

  // Chore preview
  landing_chores_eyebrow: "Ready to go",
  landing_chores_title: "20+ built-in chores",
  landing_chores_body:
    "Start with our curated chore library, or create your own.",
  landing_chores_more: "+ custom chores, one-off tasks, and more",
  landing_chore_fold: "Fold washing",
  landing_chore_toys: "Clean up toys",
  landing_chore_bed: "Make the bed",
  landing_chore_water: "Water plants",
  landing_chore_pets: "Feed the pets",
  landing_chore_books: "Pick up books",
  landing_chore_sweep: "Sweep floor",
  landing_chore_windows: "Wipe windows",
  landing_chore_table: "Set the table",
  landing_chore_bag: "Pack school bag",
  landing_chore_teeth: "Brush teeth",
  landing_chore_cook: "Help cook",

  // Final CTA
  landing_final_title_lead: "Ready to make chores",
  landing_final_title_highlight: "an adventure?",
  landing_final_body:
    "Free to use. Set up in 2 minutes. No credit card needed.",
  landing_final_cta: "Start Your Family's Adventure",

  // Wave 6 — Accessibility / screen-reader announcements.
  // These are surfaced via hidden aria-live regions on celebration moments —
  // a chest open, a weekly-goal-100% pulse, a rank-up — so screen-reader
  // users get the same feedback as sighted users (who get the coin-burst,
  // pulse-gold, and toast).
  a11y_lucky_chest_opened: "Lucky Chest opened — earned ¥{{amount}}!",
  a11y_weekly_goal_reached: "Weekly goal reached!",
  a11y_rank_up: "Rank up to {{nextRank}}!",
  // stop-test-1b: announced when a save-goal crosses 100% funded.
  goal_reached_announce: "Goal reached! You can buy {{goalTitle}} now.",

  // Wave 6 — icon-only button labels.
  a11y_logout: "Log out",
  a11y_home: "Home",
  a11y_pick_emoji: "Pick emoji {{emoji}}",

  // Wave 8b — bulk-approve
  approval_select_all: "Select all ({{count}})",
  approval_clear_selection: "Cancel selection",
  approval_bulk_button: "Approve {{count}} selected",
  approval_bulk_in_progress: "Approving {{current}} of {{total}}...",
  approval_bulk_success: "Crew rewarded ¥{{amount}} total!",
  approval_bulk_partial:
    "Approved {{ok}} of {{total}}. {{failed}} need a closer look.",

  // Wave 8c — onboarding celebration
  onboarding_celebrate_title: "Welcome aboard, Captain {{familyName}}!",
  onboarding_celebrate_subtitle: "Your crew is ready. Set sail!",
  onboarding_celebrate_announce:
    "Family setup complete. Welcome to Pirate Money.",
} as const;

export default en;
