import React, { useState, useEffect, FC } from 'react';
import { Card } from 'react-bootstrap';

import FilterControls from './FilterControls';
import CourseCardListContainer from './CourseCardListContainer';

import styles from '../../css/CourseSelectionList.module.scss';

import useAxiosFFCS from '../../hooks/useAxiosFFCS';

import * as COURSE from '../../constants/Courses';

import { CurriculumCourse } from '../../models/data/Curriculum';
import CourseSelectionProps from '../../models/components/CourseSelection/CourseSelection';
import {
	CourseList, CourseFacultyList, CourseSlotList, CourseTypeList,
} from '../../models/data/CourseLists';
import RequisitesList from '../../models/data/RequisitesList';

const CourseSelection: FC<CourseSelectionProps> = ({
	selectedCurriculum, selectedCurriculumPrefix, completedCourses,
}) => {
	const [{ data: allCourseLists }, executeGetAllCourseLists] = useAxiosFFCS({
		url: '/course/allCourseLists',
	}, { manual: true });

	useEffect(() => {
		executeGetAllCourseLists();
	}, [executeGetAllCourseLists]);

	const [courseList, setCourseList] = useState<CourseList>({});
	const [courseFacultyList, setCourseFacultyList] = useState<CourseFacultyList>({});
	const [courseSlotList, setCourseSlotList] = useState<CourseSlotList>({});
	const [courseTypeList, setCourseTypeList] = useState<CourseTypeList>({});
	const [prereqList, setPrereqList] = useState<RequisitesList>({});

	const [filteredCourseList, setFilteredCourseList] = useState<CourseList>({});

	useEffect(() => {
		if (allCourseLists) {
			setCourseList(allCourseLists.data.courseList);
			setFilteredCourseList(allCourseLists.data.courseList);
			setCourseFacultyList(allCourseLists.data.courseFacultyList);
			setCourseSlotList(allCourseLists.data.courseSlotList);
			setCourseTypeList(allCourseLists.data.courseTypeList);
			setPrereqList(allCourseLists.data.prerequisites);
		}
	}, [allCourseLists]);

	const [searchString, setSearchString] = useState('');
	const [typeFilters, setTypeFilters] = useState<string[]>([]);
	const [creditFilter, setCreditFilter] = useState('');

	const [selectedCategory, setSelectedCategory] = useState('ALL');
	const [tabsDisabled, setTabsDisabled] = useState(true);

	useEffect(() => {
		// $& means the whole matched string
		const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		let searchBySlots = false;
		let searchByFaculty = false;
		let filteredCourses = courseList;
		let filteredCodes = Object.keys(courseList) || [];

		if (selectedCategory !== 'ALL' && Object.keys(selectedCurriculum).length) {
			const category = selectedCategory.toLowerCase();
			const curriculumCodes = (selectedCurriculum[category] as CurriculumCourse[])
				.map((c) => c.code);

			filteredCodes = filteredCodes
				.filter((code) => curriculumCodes.includes(code));
		}

		const search = escapeRegExp(searchString.toUpperCase().trim());
		const searchStringSlots = search.split('\\+');

		// Default, no filtering
		if (['', '*'].includes(search)
			&& typeFilters.length === 0
			&& [0, ''].includes(creditFilter)
			&& selectedCategory === 'ALL'
		) {
			setFilteredCourseList(filteredCourses);
			return;
		}

		searchBySlots = searchStringSlots
			.reduce((a, v) => (a && COURSE.validSlots.includes(v)), true)
			&& search.length > 0;

		searchByFaculty = search.startsWith('\\*');

		if (searchBySlots) {
			const reqdSlotCodes = Array.from(
				new Set(
					Object.keys(courseSlotList)
						.filter((slot) => searchStringSlots
							.every((s) => slot.replace(' ', '').split('+').includes(s)))
						.flatMap((s: string) => courseSlotList[s]),
				),
			);

			filteredCodes = filteredCodes
				.filter((code) => reqdSlotCodes.includes(code));
		} else if (searchByFaculty) {
			// Remove all instances of *. Removes the "\*" string

			// eslint-disable-next-line no-useless-escape
			const tempSearchString = search.replace('\\\*', '');

			const reqdFacultyCodes = Array.from(new Set(
				Object.keys(courseFacultyList)
					.filter((f) => f.includes(tempSearchString))
					.flatMap((f) => courseFacultyList[f]),
			));

			filteredCodes = filteredCodes
				.filter((code) => reqdFacultyCodes.includes(code));
		} else {
			filteredCodes = Array.from(new Set(
				filteredCodes
					.filter((code) => (
						courseList[code].title.toUpperCase().search(search) !== -1
						|| code.toUpperCase().search(search) !== -1
					)),
			));
		}

		// +creditFilter converts creditFilter to a number
		if (creditFilter !== '' && +creditFilter > 0) {
			filteredCodes = Array.from(new Set(
				filteredCodes
					.filter((code) => {
						if (courseList[code].credits === Number(creditFilter)) return true;
						return false;
					}),
			));
		}

		if (typeFilters.length > 0) {
			const reqdTypeCodes = Array.from(new Set(
				Object.keys(courseTypeList)
					.filter((f) => typeFilters.includes(f))
					.flatMap((f) => courseTypeList[f]),
			));

			filteredCodes = filteredCodes
				.filter((code) => reqdTypeCodes.includes(code));
		}

		filteredCourses = Object.keys(courseList).sort()
			.filter((code) => filteredCodes.includes(code))
			.reduce((acc, code) => ({ ...acc, [code]: courseList[code] }), {});

		setFilteredCourseList(filteredCourses);
	}, [courseList, courseTypeList, courseSlotList, courseFacultyList, searchString, creditFilter, typeFilters, selectedCategory, selectedCurriculum, selectedCurriculumPrefix]);

	useEffect(() => {
		if (!selectedCurriculum || Object.keys(selectedCurriculum).length === 0 || selectedCurriculumPrefix === 'Curriculum') {
			setTabsDisabled(true);
		} else {
			setTabsDisabled(false);
		}
	}, [selectedCurriculumPrefix, selectedCurriculum]);

	return (
		<Card className={styles.courseSelectContainer}>
			<Card.Header className={styles.courseSelectTableHeader}>
				<FilterControls
					tabsDisabled={tabsDisabled}
					showPlaceholder={!searchString}
					typeFilters={typeFilters}

					setSelectedCategory={setSelectedCategory}
					setSearchString={setSearchString}
					setTypeFilters={setTypeFilters}
					setCreditFilter={setCreditFilter}
				/>
			</Card.Header>
			<Card.Body className={styles.courseSelectTableBody}>
				<CourseCardListContainer
					filteredCourseList={filteredCourseList}
					prereqList={prereqList}
					completedCourses={completedCourses}
				/>
			</Card.Body>
		</Card>
	);
};

export default CourseSelection;
