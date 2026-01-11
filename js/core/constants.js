// ==========================================
// 🔑 CORE CONSTANTS & CONFIG
// ==========================================

export const STORAGE_KEYS = {
    STREAM_CONFIG: 'examStreamsConfig',
    ROOM_CONFIG: 'examRoomConfig',
    COLLEGE_NAME: 'examCollegeName',
    ABSENTEE_LIST: 'examAbsenteeList',
    QP_CODES: 'examQPCodes',
    BASE_DATA: 'examBaseData',

    // Allotment & Mapping
    ROOM_ALLOTMENT: 'examRoomAllotment',
    INVIGILATOR_MAPPING: 'examInvigilatorMapping',

    // Scribe
    SCRIBE_LIST: 'examScribeList',
    SCRIBE_ALLOTMENT: 'examScribeAllotment',

    // Rules & Config
    EXAM_RULES: 'examRulesConfig',

    // Invigilation Module Specific
    INVIGILATION_SLOTS: 'examInvigilationSlots',
    STAFF_DATA: 'examStaffData',
    UNAVAILABILITY: 'invigAdvanceUnavailability'
};

// Keys included in Backup/Restore
export const BACKUP_KEYS = [
    STORAGE_KEYS.ROOM_CONFIG,
    STORAGE_KEYS.STREAM_CONFIG,
    STORAGE_KEYS.COLLEGE_NAME,
    STORAGE_KEYS.ABSENTEE_LIST,
    STORAGE_KEYS.QP_CODES,
    STORAGE_KEYS.BASE_DATA,
    STORAGE_KEYS.ROOM_ALLOTMENT,
    STORAGE_KEYS.SCRIBE_LIST,
    STORAGE_KEYS.SCRIBE_ALLOTMENT,
    STORAGE_KEYS.EXAM_RULES,

    // Modular Keys
    STORAGE_KEYS.INVIGILATION_SLOTS,
    STORAGE_KEYS.STAFF_DATA,
    STORAGE_KEYS.INVIGILATOR_MAPPING
];

export const APP_INFO = {
    VERSION: 'V12.9 (Modular)',
    SUPER_ADMIN_EMAIL: "sureshmagnolia@gmail.com"
};
