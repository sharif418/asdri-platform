import { courses, studentDevelopmentPrograms } from "@/content/courses";
import { pysSpecializations } from "@/content/courses/pys";
import { leadershipTeam, facultyGroups, campusLifeItems } from "@/content/faculty";
import { alumniBatches, alumniIntro } from "@/content/media";
import { admissionSteps, scholarshipInfo, facilities, faqGroups } from "@/content/admission";
import { siteConfig } from "@/content/site";
import type { LocalizedText } from "@/types";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient;

/** LocalizedText[] → bilingual HTML paragraphs (rich text the office edits). */
function paragraphs(items: LocalizedText[] | readonly LocalizedText[]): { bn: string; en: string } {
  return {
    bn: items.map((i) => `<p>${i.bn}</p>`).join("\n"),
    en: items.map((i) => `<p>${i.en}</p>`).join("\n"),
  };
}

/** LocalizedText[] → bilingual HTML list. */
function htmlList(items: LocalizedText[] | readonly LocalizedText[]): { bn: string; en: string } {
  return {
    bn: `<ul>${items.map((i) => `<li>${i.bn}</li>`).join("")}</ul>`,
    en: `<ul>${items.map((i) => `<li>${i.en}</li>`).join("")}</ul>`,
  };
}

function text(l: LocalizedText | null | undefined): { bn: string; en: string } {
  return { bn: l?.bn ?? "", en: l?.en ?? "" };
}

const COURSE_CODES: Record<string, string> = {
  "preparatory-year-for-specialization": "PYS",
  "certificate-course-in-islamic-studies": "CCIS",
  "diploma-in-dawah-islamic-studies": "DDIS",
  "arabic-language-teacher-training": "ATT",
  "ramadan-dawah-training": "RDT",
  "azan-training": "AZAN",
  "islamic-research-methodology": "IRM",
};

/* ————— Teams ————— */

const TEAM_SEEDS: { key: string; nameBn: string; nameEn: string; descriptionBn: string; descriptionEn: string; sortOrder: number }[] = [
  { key: "leadership", nameBn: "নেতৃত্ব ও প্রশাসন", nameEn: "Leadership & Administration", descriptionBn: "ইনস্টিটিউটের পরিচালনা পরিষদ", descriptionEn: "The institute's governing team", sortOrder: 0 },
  { key: "teachers-panel", nameBn: "শিক্ষক প্যানেল", nameEn: "Teacher's Panel", descriptionBn: "দেশ-বিদেশের স্বীকৃত শিক্ষাবিদ ও গবেষকদের সমন্বয়ে গঠিত", descriptionEn: "Comprising recognized scholars and researchers from home and abroad", sortOrder: 1 },
  { key: "arabic-team", nameBn: "আরবি টিম", nameEn: "Arabic Team", descriptionBn: "আরবি ভাষা বিভাগের শিক্ষকমণ্ডলী", descriptionEn: "The Arabic language department's teachers", sortOrder: 2 },
  { key: "tajweed-team", nameBn: "তাজবিদ টিম", nameEn: "Tajweed Team", descriptionBn: "তাজবিদ ও কিরাআত বিভাগ", descriptionEn: "The tajweed and recitation department", sortOrder: 3 },
  { key: "language-support", nameBn: "ভাষা ও সহায়ক টিম", nameEn: "Language & Support Team", descriptionBn: "ইংরেজি, বাংলা, কম্পিউটার ও গণিত সহায়ক শিক্ষকবৃন্দ", descriptionEn: "English, Bangla, computer, and mathematics support teachers", sortOrder: 4 },
];

/* ————— People (leadership + all faculty groups) ————— */

interface PersonSeed {
  slug: string;
  nameBn: string;
  nameEn: string;
  titleBn: string;
  titleEn: string;
  roleTitleBn: string;
  roleTitleEn: string;
  bioBn: string;
  bioEn: string;
  subjectsBn: string;
  subjectsEn: string;
  teamKey: string;
  isFeatured: boolean;
  sortOrder: number;
}

function buildPeople(): PersonSeed[] {
  const people: PersonSeed[] = [];
  let order = 0;

  for (const member of leadershipTeam) {
    people.push({
      slug: member.id,
      nameBn: member.name.bn,
      nameEn: member.name.en,
      titleBn: member.role.bn,
      titleEn: member.role.en,
      roleTitleBn: member.role.bn,
      roleTitleEn: member.role.en,
      bioBn: member.bio?.bn ?? "",
      bioEn: member.bio?.en ?? "",
      subjectsBn: "",
      subjectsEn: "",
      teamKey: "leadership",
      isFeatured: true,
      sortOrder: order++,
    });
  }

  const teamKeyById: Record<string, string> = {
    "teachers-panel": "teachers-panel",
    "arabic-team": "arabic-team",
    "tajweed-team": "tajweed-team",
    "language-team": "language-support",
  };
  for (const group of facultyGroups) {
    const key = teamKeyById[group.id] ?? "language-support";
    for (const member of group.members) {
      const existing = people.find((p) => p.slug === member.id);
      const subjects = (member as { subjects?: LocalizedText[] }).subjects ?? [];
      const subjectList = {
        bn: subjects.map((s) => s.bn).join(", "),
        en: subjects.map((s) => s.en).join(", "),
      };
      if (existing) {
        // leadership members also teach — merge subjects in
        if (subjectList.bn) {
          existing.subjectsBn = existing.subjectsBn ? `${existing.subjectsBn}; ${subjectList.bn}` : subjectList.bn;
          existing.subjectsEn = existing.subjectsEn ? `${existing.subjectsEn}; ${subjectList.en}` : subjectList.en;
        }
        continue;
      }
      const designation = (member as { designation?: LocalizedText }).designation;
      people.push({
        slug: member.id,
        nameBn: member.name.bn,
        nameEn: member.name.en,
        titleBn: designation?.bn ?? "উস্তাজ",
        titleEn: designation?.en ?? "Ustadh",
        roleTitleBn: designation?.bn ?? "উস্তাজ",
        roleTitleEn: designation?.en ?? "Ustadh",
        bioBn: "",
        bioEn: "",
        subjectsBn: subjectList.bn,
        subjectsEn: subjectList.en,
        teamKey: key,
        isFeatured: false,
        sortOrder: order++,
      });
    }
  }
  return people;
}

/* ————— Courses with curricula ————— */

export async function seedAcademics(db: Db): Promise<Map<string, string>> {
  // teams
  const teamIds = new Map<string, string>();
  for (const team of TEAM_SEEDS) {
    const row = await db.team.upsert({
      where: { key: team.key },
      update: team,
      create: { ...team, isPublished: true },
    });
    teamIds.set(team.key, row.id);
  }

  // people
  for (const person of buildPeople()) {
    const { teamKey, ...personFields } = person;
    await db.person.upsert({
      where: { slug: person.slug },
      update: { ...personFields, team: { connect: { key: teamKey } } },
      create: { ...personFields, isPublished: true, team: { connect: { key: teamKey } } },
    });
  }

  // courses + curriculum trees (delete children and rebuild keeps reseeds exact)
  const courseIds = new Map<string, string>();
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const code = COURSE_CODES[course.slug] ?? course.slug.slice(0, 6).toUpperCase();
    const details = course.details;
    const overview = text(course.details.intro);
    const objectives = htmlList(details.objectives);
    const eligibility = htmlList(details.eligibility);
    const outcomes = paragraphs(details.outcomes);

    const row = await db.course.upsert({
      where: { slug: course.slug },
      update: {
        code,
        titleBn: course.titleBn,
        titleEn: course.titleEn,
        titleAr: course.titleAr ?? null,
        taglineBn: course.tagline.bn,
        taglineEn: course.tagline.en,
        overviewBn: overview.bn,
        overviewEn: overview.en,
        objectivesBn: objectives.bn,
        objectivesEn: objectives.en,
        eligibilityBn: eligibility.bn,
        eligibilityEn: eligibility.en,
        careerBn: outcomes.bn,
        careerEn: outcomes.en,
        durationBn: course.durationLabel.bn,
        durationEn: course.durationLabel.en,
        courseTypeBn: `${details.kind.bn} · ${details.accommodation.bn}`,
        courseTypeEn: `${details.kind.en} · ${details.accommodation.en}`,
        isFeatured: course.featured,
        isPublished: true,
        sortOrder: i,
      },
      create: {
        code,
        slug: course.slug,
        titleBn: course.titleBn,
        titleEn: course.titleEn,
        titleAr: course.titleAr ?? null,
        taglineBn: course.tagline.bn,
        taglineEn: course.tagline.en,
        overviewBn: overview.bn,
        overviewEn: overview.en,
        objectivesBn: objectives.bn,
        objectivesEn: objectives.en,
        eligibilityBn: eligibility.bn,
        eligibilityEn: eligibility.en,
        careerBn: outcomes.bn,
        careerEn: outcomes.en,
        durationBn: course.durationLabel.bn,
        durationEn: course.durationLabel.en,
        courseTypeBn: `${details.kind.bn} · ${details.accommodation.bn}`,
        courseTypeEn: `${details.kind.en} · ${details.accommodation.en}`,
        isFeatured: course.featured,
        isPublished: true,
        sortOrder: i,
      },
    });
    courseIds.set(course.slug, row.id);

    // curriculum: semesters → subjects (rebuild)
    await db.semester.deleteMany({ where: { courseId: row.id } });
    for (let s = 0; s < details.curriculum.length; s++) {
      const sem = details.curriculum[s];
      const isSupplementary = sem.label.bn.includes("সম্পূরক") || sem.label.en.toLowerCase().includes("supplementary");
      const semRow = await db.semester.create({
        data: {
          courseId: row.id,
          number: s + 1,
          year: Math.floor(s / 2) + 1,
          titleBn: sem.label.bn,
          titleEn: sem.label.en,
          durationBn: "",
          durationEn: "",
        },
      });
      for (let c = 0; c < sem.courses.length; c++) {
        const subject = sem.courses[c];
        await db.subject.create({
          data: {
            semesterId: semRow.id,
            code: subject.code,
            titleBn: subject.title.bn,
            titleEn: subject.title.en,
            modulesBn: subject.modules.map((m) => m.name.bn).join("\n"),
            modulesEn: subject.modules.map((m) => m.name.en).join("\n"),
            credits: subject.credits,
            marks: subject.marks,
            isNonCredit: isSupplementary || subject.credits === 0,
            sortOrder: c,
          },
        });
      }
    }

    // specializations (PYS)
    if (course.slug === "preparatory-year-for-specialization") {
      await db.courseSpecialization.deleteMany({ where: { courseId: row.id } });
      for (let z = 0; z < pysSpecializations.length; z++) {
        const spec = pysSpecializations[z];
        await db.courseSpecialization.create({
          data: {
            courseId: row.id,
            nameBn: spec.bn,
            nameEn: spec.en,
            nameAr: spec.ar ?? null,
            sortOrder: z,
          },
        });
      }
    }

    // SDP programs (bound to PYS per the client document)
    if (course.slug === "preparatory-year-for-specialization") {
      await db.sdpProgram.deleteMany({ where: { courseId: row.id } });
      for (let p = 0; p < studentDevelopmentPrograms.length; p++) {
        const sdp = studentDevelopmentPrograms[p] as unknown as {
          id: string;
          title: LocalizedText;
          objective: LocalizedText;
          activities: LocalizedText;
          hours: number;
          outcome: LocalizedText;
        };
        await db.sdpProgram.create({
          data: {
            courseId: row.id,
            titleBn: sdp.title.bn,
            titleEn: sdp.title.en,
            objectiveBn: sdp.objective.bn,
            objectiveEn: sdp.objective.en,
            activitiesBn: sdp.activities.bn,
            activitiesEn: sdp.activities.en,
            hours: sdp.hours,
            outcomeBn: sdp.outcome.bn,
            outcomeEn: sdp.outcome.en,
            sortOrder: p,
          },
        });
      }
    }
  }

  // alumni batches (from the client document)
  const courseKeyByProgram: Record<string, string> = {
    PGDID: "DDIS",
    CCIS: "CCIS",
    ATT: "ATT",
  };
  await db.alumniBatch.deleteMany({});
  const year = new Date().getUTCFullYear();
  for (const group of alumniBatches) {
    const code = courseKeyByProgram[group.program.en.match(/\(([^)]+)\)/)?.[1] ?? ""] ?? "PGDID";
    for (let b = 0; b < group.batches.length; b++) {
      const batch = group.batches[b];
      await db.alumniBatch.create({
        data: {
          courseKey: code,
          year: year - (group.batches.length - 1 - b),
          batchNoBn: batch.batch.bn,
          batchNoEn: batch.batch.en,
          count: batch.count,
          noteBn: group.program.bn,
          noteEn: group.program.en,
        },
      });
    }
  }
  // alumni intro paragraph lives in settings
  await db.siteSetting.upsert({
    where: { key: "site.alumni" },
    update: { value: { introBn: alumniIntro.bn, introEn: alumniIntro.en } as Prisma.InputJsonValue },
    create: { key: "site.alumni", value: { introBn: alumniIntro.bn, introEn: alumniIntro.en } as Prisma.InputJsonValue },
  });

  // facilities (campus & facilities)
  for (let f = 0; f < facilities.length; f++) {
    const facility = facilities[f] as unknown as { id?: string; title: LocalizedText; description: LocalizedText };
    const existing = await db.facility.findFirst({ where: { titleBn: facility.title.bn } });
    const data = {
      titleBn: facility.title.bn,
      titleEn: facility.title.en,
      descriptionBn: facility.description.bn,
      descriptionEn: facility.description.en,
      sortOrder: f,
      isPublished: true,
    };
    if (existing) {
      await db.facility.update({ where: { id: existing.id }, data });
    } else {
      await db.facility.create({ data });
    }
  }

  // campus life items → facilities (the round-1 campus band)
  for (let c = 0; c < campusLifeItems.length; c++) {
    const item = campusLifeItems[c] as unknown as { id: string; title: LocalizedText; description: LocalizedText; image: string; icon: string };
    const existing = await db.facility.findFirst({ where: { titleBn: item.title.bn } });
    const data = {
      titleBn: item.title.bn,
      titleEn: item.title.en,
      descriptionBn: item.description.bn,
      descriptionEn: item.description.en,
      sortOrder: 100 + c,
      isPublished: true,
    };
    if (existing) {
      await db.facility.update({ where: { id: existing.id }, data });
    } else {
      await db.facility.create({ data });
    }
  }

  // admission steps (5-step process from the client document)
  await db.admissionStep.deleteMany({});
  for (let s = 0; s < admissionSteps.length; s++) {
    const step = admissionSteps[s] as unknown as { title: LocalizedText; description: LocalizedText };
    await db.admissionStep.create({
      data: {
        stepNumber: s + 1,
        titleBn: step.title.bn,
        titleEn: step.title.en,
        descriptionBn: step.description.bn,
        descriptionEn: step.description.en,
        isPublished: true,
      },
    });
  }

  // scholarship (single rich block from the client document)
  const scholarshipExisting = await db.scholarship.findFirst();
  const scholarshipData = {
    nameBn: "শতভাগ (১০০%) স্কলারশিপ — যাকাত ফান্ড",
    nameEn: "100% Scholarship — Zakat Fund",
    descriptionBn: paragraphs(scholarshipInfo.body).bn,
    descriptionEn: paragraphs(scholarshipInfo.body).en,
    criteriaBn: "",
    criteriaEn: "",
    sortOrder: 0,
    isPublished: true,
  };
  if (scholarshipExisting) {
    await db.scholarship.update({ where: { id: scholarshipExisting.id }, data: scholarshipData });
  } else {
    await db.scholarship.create({ data: scholarshipData });
  }

  // FAQs
  await db.faq.deleteMany({});
  let faqOrder = 0;
  for (const group of faqGroups) {
    for (const item of group.items as unknown as { question: LocalizedText; answer: LocalizedText }[]) {
      await db.faq.create({
        data: {
          categoryBn: group.title.bn,
          categoryEn: group.title.en,
          questionBn: item.question.bn,
          questionEn: item.question.en,
          answerBn: item.answer.bn,
          answerEn: item.answer.en,
          sortOrder: faqOrder++,
          isPublished: true,
        },
      });
    }
  }

  console.log(
    `  ✓ ${TEAM_SEEDS.length} teams, ${buildPeople().length} people, ${courses.length} courses (full curricula), alumni, facilities, steps, scholarships, FAQs`,
  );
  return courseIds;
}

export { siteConfig };
