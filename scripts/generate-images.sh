#!/bin/bash
mkdir -p /home/z/my-project/public/images
cd /home/z/my-project/public/images

gen() {
  local file="$1"; shift
  local size="$1"; shift
  if [ -s "$file" ]; then echo "skip $file"; return; fi
  echo ">>> generating $file"
  z-ai image -p "$*" -o "$file" -s "$size" && echo "OK $file" || echo "FAIL $file"
}

gen hero-campus.png 1440x720 "Serene Islamic educational institute campus courtyard in Bangladesh at golden hour, elegant white building with pointed arches and green dome accents, students in white panjabi walking with books, lush trees, warm cinematic light, professional architectural photography, high quality, detailed"
gen campus-library.png 1344x768 "Elegant Islamic library interior with tall wooden bookshelves, Arabic calligraphy frames on warm walls, students reading at wooden desks with brass lamps, soft natural window light, scholarly warm atmosphere, professional photography, high quality"
gen campus-classroom.png 1344x768 "Modern Islamic studies classroom, students in white caps and panjabi at wooden desks with open Arabic books, teacher at whiteboard with Arabic calligraphy, bright natural light, respectful educational atmosphere, professional photography, high quality"
gen campus-fieldwork.png 1344x768 "Group of young Bangladeshi dawah students with books visiting a rural village home, sharing Islamic books with villagers, green paddy fields background, warm afternoon light, documentary photography style, authentic, high quality"
gen campus-seminar.png 1344x768 "Islamic academic seminar in Dhaka Bangladesh, speaker at podium on stage with green and gold backdrop, large attentive audience of scholars in traditional dress, conference hall, professional event photography, high quality"
gen campus-graduation.png 1344x768 "Islamic institute graduation ceremony, rows of graduating students in white formal dress receiving certificates on stage, celebratory warm lights, dignified academic event, professional photography, high quality"
gen azan-training.png 1344x768 "Muezzin training session, student practicing call to prayer beside mosque minaret interior, teacher listening attentively, beautiful mosque architecture with arches and chandeliers, soft spiritual light, professional photography, high quality"
gen campus-mosque.png 1344x768 "Beautiful mosque prayer hall interior with rows of green prayer rugs, ornate chandeliers, geometric Islamic patterns on arches, soft light rays through windows, serene spiritual atmosphere, professional photography, high quality"
gen study-circle.png 1344x768 "Group study circle of Bangladeshi Islamic students sitting on floor cushions around low table with open books, engaged discussion, library background with warm lamps, cozy scholarly atmosphere, professional photography, high quality"
gen student-debate.png 1344x768 "University student panel discussion on stage, young Bangladeshi speakers at podium with microphones, audience in seminar hall, academic conference atmosphere, green and gold stage decor, professional photography, high quality"
gen blog-science.png 1344x768 "Conceptual illustration of Islam and science harmony, golden astrolabe and geometric Islamic patterns merging with subtle constellation lines and Arabic calligraphy, deep emerald green and gold palette, elegant, high quality digital art"
gen blog-secularism.png 1344x768 "Conceptual editorial illustration about secularism and faith, balanced scales with mosque silhouette and modern city skyline, muted emerald and gold tones, minimalist elegant composition, high quality digital art"
gen blog-atheism.png 1344x768 "Conceptual illustration of answering doubt with light, open ancient book glowing with warm golden light illuminating dark surroundings, Islamic geometric patterns emerging from light, emerald and gold palette, elegant, high quality digital art"
gen blog-feminism.png 1344x768 "Elegant editorial illustration of women rights in Islam, dignified silhouette of woman in hijab reading book with soft golden glow, arabesque patterns background, emerald green and antique gold palette, respectful, high quality digital art"
gen blog-orientalism.png 1344x768 "Conceptual illustration of orientalism critique, ancient map with magnifying glass and orientalist paintings being examined, library setting, muted gold and emerald tones, thoughtful composition, high quality digital art"
gen news-agreement.png 1344x768 "Bangladeshi Islamic scholars from two institutes shaking hands at memorandum signing ceremony, table with documents, green flag backdrop, formal event photography, high quality"
echo "ALL DONE"
