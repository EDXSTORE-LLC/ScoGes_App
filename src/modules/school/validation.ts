import "server-only";
import { z } from "zod";
import {
  yearSchema,
  programSchema,
  levelSchema,
  classSchema,
  termSchema,
} from "@/modules/academics/schemas";
import {
  studentSchema,
  guardianSchema,
  linkSchema,
} from "@/modules/people/schemas";
import { enrollmentSchema } from "@/modules/enrollments/schemas";
export const schoolSchemas = {
  years: yearSchema,
  programs: programSchema,
  levels: levelSchema,
  classes: classSchema,
  terms: termSchema,
  students: studentSchema,
  guardians: guardianSchema,
  links: linkSchema,
  enrollments: enrollmentSchema,
};

import { schoolKinds, type SchoolKind } from "./registry";
export const schoolKindSchema = z.enum(schoolKinds);
export type SchoolData = z.infer<(typeof schoolSchemas)[SchoolKind]>;
