
export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    // Sidebar
    chats: "聊天",
    contacts: "通讯录",
    settings: "全局设置",
    theme_light: "浅色模式",
    theme_dark: "深色模式",
    
    // ChatList
    app_name: "WeChat AI",
    search: "搜索",
    no_chats: "暂无聊天",
    new_chat: "发起聊天",
    
    // ChatWindow
    ai_debate: "AI 自动互聊",
    random_speak: "随机发言 (手动触发)",
    type_message: "输入消息...",
    interrupt: "AI 正在激烈讨论中，输入内容可打断...",
    press_enter: "按 Enter 发送",
    send: "发送",
    members: "人",
    chat_settings: "群管理 & 设置",
    
    // PersonaManager
    contacts_title: "通讯录",
    new_ai: "新建 AI",
    ai_characters: "AI 角色",
    create_persona_title: "创建新的 AI 角色",
    name_label: "名字",
    role_label: "身份 / 头衔",
    instruction_label: "性格与指令 (System Prompt)",
    instruction_placeholder: "描述这个 AI 的性格、说话语气和行为逻辑...",
    instruction_hint: "这段文字将直接作为 System Prompt 发送给模型。",
    model_label: "专用模型 (可选)",
    model_default: "使用全局默认设置",
    cancel: "取消",
    create: "创建角色",
    update: "更新角色",
    send_message: "发消息",
    select_contact_hint: "选择左侧联系人查看详情或创建新角色",
    name_placeholder: "例如：鲁迅",
    role_placeholder: "例如：文学家",

    // CreateChatModal
    start_group_chat: "发起群聊",
    group_name_placeholder: "群聊名称 (选填)",
    select_participants: "选择 AI 参与者",
    start_chat_btn: "开始聊天",
    
    // Settings
    settings_title: "连接设置",
    chat_settings_title: "群管理",
    use_global: "使用全局设置",
    provider_hint: "你可以使用任何兼容 OpenAI 格式的接口商 (如 NewAPI, OneAPI, DeepSeek 等)。",
    base_url: "接口地址 (Base URL)",
    base_url_desc: "完整的 API 路径。例如：https://api.newapi.pro/v1",
    api_key: "API Key (令牌)",
    model_name: "模型名称",
    model_name_desc: "常用：gpt-4o, claude-3-5-sonnet, gemini-1.5-pro",
    fetch_models: "获取模型列表",
    fetching: "获取中...",
    danger_zone: "危险区域",
    reset_data: "重置所有数据",
    reset_confirm: "确定要重置吗？这将清空所有聊天记录和自定义角色。",
    save_settings: "保存设置",
    fetch_error: "获取模型失败，请检查 URL 和 Key",
    fetch_success: "成功获取模型列表",
    switch_to_manual: "切换到手动输入",
    switch_to_list: "切换到列表选择",
    select_model_placeholder: "请选择模型...",
    
    // Chat Settings Tabs
    tab_settings: "连接设置",
    tab_members: "群成员",
    tab_data: "数据管理",
    
    // Group Management
    invite_member: "邀请新成员",
    select_to_invite: "选择要邀请的角色...",
    invite_btn: "邀请",
    export_txt: "导出聊天记录 (TXT)",
    clear_history: "清空聊天记录",
    clear_confirm: "确定要清空本群的所有聊天记录吗？此操作无法撤销。",
    
    // Moderator
    moderator_thinking: "裁判正在指定发言人...",
  },
  en: {
    // Sidebar
    chats: "Chats",
    contacts: "Contacts",
    settings: "Global Settings",
    theme_light: "Light Mode",
    theme_dark: "Dark Mode",
    
    // ChatList
    app_name: "WeChat AI",
    search: "Search",
    no_chats: "No chats yet",
    new_chat: "New Chat",
    
    // ChatWindow
    ai_debate: "AI Debate",
    random_speak: "Random Speak (Manual)",
    type_message: "Type a message...",
    interrupt: "AI debate active. Type to interrupt...",
    press_enter: "Press Enter to send",
    send: "Send",
    members: "members",
    chat_settings: "Group Info & Settings",
    
    // PersonaManager
    contacts_title: "Contacts",
    new_ai: "New AI",
    ai_characters: "AI CHARACTERS",
    create_persona_title: "Create New AI Persona",
    name_label: "NAME",
    role_label: "ROLE / TITLE",
    instruction_label: "PERSONALITY & INSTRUCTION",
    instruction_placeholder: "Describe how this AI should behave...",
    instruction_hint: "This prompt guides the model.",
    model_label: "SPECIFIC MODEL (OPTIONAL)",
    model_default: "Use Global Default",
    cancel: "Cancel",
    create: "Create Persona",
    update: "Update Persona",
    send_message: "Send Message",
    select_contact_hint: "Select a contact to view details or create a new AI.",
    name_placeholder: "e.g. Socrates",
    role_placeholder: "e.g. Philosopher",

    // CreateChatModal
    start_group_chat: "Start Group Chat",
    group_name_placeholder: "Group Name (Optional)",
    select_participants: "SELECT AI PARTICIPANTS",
    start_chat_btn: "Start Chat",
    
    // Settings
    settings_title: "Connection Settings",
    chat_settings_title: "Chat Management",
    use_global: "Use Global Settings",
    provider_hint: "You can use any OpenAI-compatible provider (e.g., NewAPI, OneAPI, DeepSeek).",
    base_url: "API Base URL",
    base_url_desc: "The full URL version. Example: https://api.newapi.pro/v1",
    api_key: "API Key",
    model_name: "Model Name",
    model_name_desc: "Common: gpt-4o, claude-3-5-sonnet, gemini-1.5-pro",
    fetch_models: "Fetch Models",
    fetching: "Fetching...",
    danger_zone: "Danger Zone",
    reset_data: "Reset All Data",
    reset_confirm: "Are you sure? This will delete all chats and custom personas.",
    save_settings: "Save Settings",
    fetch_error: "Failed to fetch models. Check URL/Key.",
    fetch_success: "Models fetched successfully",
    switch_to_manual: "Switch to Manual Input",
    switch_to_list: "Switch to List Selection",
    select_model_placeholder: "Select a model...",
    
    // Chat Settings Tabs
    tab_settings: "Connection",
    tab_members: "Members",
    tab_data: "Data & Export",
    
    // Group Management
    invite_member: "Invite Member",
    select_to_invite: "Select persona to invite...",
    invite_btn: "Invite",
    export_txt: "Export History (TXT)",
    clear_history: "Clear History",
    clear_confirm: "Are you sure you want to clear all history in this chat? This cannot be undone.",
    
    // Moderator
    moderator_thinking: "Moderator is choosing next speaker...",
  }
};
