import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { getHeatmap, getAllCourseLists } from '../api/course';

import HeatmapCourse from '../models/data/HeatmapCourse';
import {
	CourseList,
	CourseSlotList,
	CourseTypeList,
	CourseFacultyList,
} from '../models/data/CourseLists';
import RequisitesList from '../models/data/RequisitesList';
import CourseSlice from '../models/state/CourseSlice';

const ACTION_BASE = 'course';

export const fetchHeatmap = createAsyncThunk(
	`${ACTION_BASE}/fetchHeatmap`,
	async (timestamp: string) => {
		const data = await getHeatmap(timestamp);
		return data;
	},
);

export const fetchAllCourseLists = createAsyncThunk(
	`${ACTION_BASE}/fetchAllCourseLists`,
	async (timestamp: string) => {
		const data = getAllCourseLists(timestamp);
		return data;
	},
);

const initialState: CourseSlice = {
	selected: '',
	heatmap: {
		data: JSON.parse(localStorage.getItem('heatmap') ?? '[]'),
		timestamp: localStorage.getItem('heatmapTimestamp') ?? '',
	},
	lists: {
		course: {},
		slot: {},
		faculty: {},
		type: {},
		req: {},
		timestamp: localStorage.getItem('listsTimetstamp') ?? '',
	},
};

const courseSlice = createSlice({
	name: ACTION_BASE,
	initialState,
	reducers: {
		selectCourse: (state, action: PayloadAction<string>) => {
			state.selected = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(
			fetchHeatmap.fulfilled,
			(state, action: PayloadAction<{ heatmap: HeatmapCourse[], timestamp: string }>) => {
				const { heatmap, timestamp } = action.payload;

				state.heatmap.data = heatmap;
				state.heatmap.timestamp = timestamp;
			},
		);

		builder.addCase(
			fetchAllCourseLists.fulfilled,
			(state, action: PayloadAction<{
				courseList: CourseList,
				courseSlotList: CourseSlotList,
				courseFacultyList: CourseFacultyList,
				courseTypeList: CourseTypeList,
				prerequisites: RequisitesList,
				timestamp: string
			}>) => {
				const {
					courseList,
					courseSlotList,
					courseFacultyList,
					courseTypeList,
					prerequisites,
					timestamp,
				} = action.payload;

				state.lists.course = courseList;
				state.lists.slot = courseSlotList;
				state.lists.faculty = courseFacultyList;
				state.lists.type = courseTypeList;
				state.lists.req = prerequisites;
				state.lists.timestamp = timestamp;
			},
		);
	},
});

export const {
	selectCourse,
} = courseSlice.actions;

export default courseSlice.reducer;
