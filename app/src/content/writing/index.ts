import type { WritingMock } from "../types";

/**
 * Writing module: ten stored mocks, Academic Task 1 and Task 2 in every one.
 *
 * Every Task 1 figure is real published data, and each chart names its source.
 * The rubric engine reads the prompt, the data and the response together, so a
 * candidate is marked against the same evidence a human examiner would use.
 */
export const WRITING_MOCKS: WritingMock[] = [
  {
    id: "W01",
    title: "Mock 01",
    focus: "Urbanisation and city life",
    tasks: [
      {
        task: 1,
        expects: "data_description",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The chart below shows the share of the world's population living in urban areas between 1950 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        chart: {
          kind: "line",
          title: "Share of world population living in urban areas",
          unit: "% of total population",
          categories: ["1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"],
          series: [
            { name: "World", values: [30, 34, 37, 39, 43, 47, 52, 56] },
            { name: "More developed regions", values: [55, 61, 67, 70, 72, 74, 77, 79] },
            { name: "Less developed regions", values: [18, 22, 25, 29, 35, 40, 46, 51] },
          ],
          source: "United Nations, World Urbanization Prospects",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "Some people believe that the growth of very large cities improves the quality of life for everyone who lives in them. Others believe that once a city passes a certain size, the quality of life begins to fall. Discuss both views and give your own opinion. Write at least 250 words.",
      },
    ],
  },

  {
    id: "W02",
    title: "Mock 02",
    focus: "Energy and consumption",
    tasks: [
      {
        task: 1,
        expects: "data_description",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The bar chart below shows average electricity consumption per person in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        chart: {
          kind: "bar",
          title: "Electricity consumption per person, 2022",
          unit: "kWh per person per year",
          categories: ["Canada", "United States", "Germany", "China", "India", "Nigeria"],
          series: [
            { name: "Consumption", values: [15000, 12700, 6000, 6100, 1300, 130] },
          ],
          source: "International Energy Agency and Ember, country electricity data for 2022",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "In many countries, household energy use is rising even though appliances have become more efficient. What are the causes of this, and what measures could governments take to reduce household energy consumption? Write at least 250 words.",
      },
    ],
  },

  {
    id: "W03",
    title: "Mock 03",
    focus: "Digital access",
    tasks: [
      {
        task: 1,
        expects: "data_description",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The table below shows the percentage of the population using the internet in five world regions in 2005 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        chart: {
          kind: "table",
          title: "Individuals using the internet, % of population",
          columns: ["Region", "2005", "2023"],
          rows: [
            ["Europe", "46", "91"],
            ["The Americas", "36", "87"],
            ["Arab States", "13", "74"],
            ["Asia and the Pacific", "9", "69"],
            ["Africa", "2", "37"],
          ],
          source: "International Telecommunication Union, Facts and Figures",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "Some people argue that governments should treat internet access as a basic public service, like water or electricity. To what extent do you agree or disagree? Write at least 250 words.",
      },
    ],
  },

  {
    id: "W04",
    title: "Mock 04",
    focus: "Water and treatment",
    tasks: [
      {
        task: 1,
        expects: "process_description",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The diagram below shows how a surface water treatment plant turns river water into drinking water. Summarise the information by selecting and reporting the main features. Write at least 150 words.",
        chart: {
          kind: "process",
          title: "From river water to drinking water",
          steps: [
            { label: "Intake", detail: "Water is drawn from the river through a screened pipe." },
            { label: "Screening and settling", detail: "Debris is removed and solids are allowed to sink." },
            { label: "Coagulation", detail: "A chemical is added so that fine particles clump together." },
            { label: "Filtration", detail: "Water passes through beds of sand and gravel." },
            { label: "Disinfection", detail: "Chlorine or ultraviolet light destroys remaining organisms." },
            { label: "Storage and distribution", detail: "Treated water is held in a covered tank and pumped to homes." },
          ],
          source: "Standard municipal surface water treatment process",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "Access to clean water is limited in many parts of the world. Some people say that water should be priced high enough to discourage waste, while others say that water is a human right and should be free at the point of use. Discuss both views and give your own opinion. Write at least 250 words.",
      },
    ],
  },

  {
    id: "W05",
    title: "Mock 05",
    focus: "Coastal change",
    tasks: [
      {
        task: 1,
        expects: "map_comparison",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The two maps below show a coastal town in 1990 and in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        chart: {
          kind: "map",
          title: "Eastport, 1990 and 2020",
          before: [
            "A single road running north from the harbour",
            "Working fishing quay along the western shore",
            "Salt marsh east of the road, undrained",
            "Farmland to the north of the town",
            "No rail connection",
          ],
          after: [
            "A bypass carrying traffic around the town centre",
            "Marina and apartment blocks on the western shore",
            "Salt marsh partly built over, with a nature reserve remaining",
            "Farmland replaced by housing and a business park",
            "A rail line with a station on the northern edge",
          ],
          source: "Original map task written for Ready Band Pro",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "Tourism has grown rapidly in many coastal towns. Some people say the economic benefits outweigh the damage to the local environment, while others believe the damage is too great to accept. To what extent do you agree or disagree? Write at least 250 words.",
      },
    ],
  },

  {
    id: "W06",
    title: "Mock 06",
    focus: "Waste and recycling",
    tasks: [
      {
        task: 1,
        expects: "data_description",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The pie chart below shows what happened to the world's plastic waste in 2019. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        chart: {
          kind: "pie",
          title: "Disposal of plastic waste worldwide, 2019",
          unit: "% of total plastic waste",
          slices: [
            { label: "Sanitary landfill", value: 50 },
            { label: "Mismanaged or dumped", value: 22 },
            { label: "Incineration", value: 19 },
            { label: "Recycled", value: 9 },
          ],
          source: "OECD, Global Plastics Outlook, 2022 (2019 data)",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "Many countries now charge households for the waste they produce. What are the advantages and disadvantages of this approach, and what other measures might reduce the amount of waste sent to landfill? Write at least 250 words.",
      },
    ],
  },

  {
    id: "W07",
    title: "Mock 07",
    focus: "Forests and land use",
    tasks: [
      {
        task: 1,
        expects: "data_description",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The line graph below shows the area of forest cleared each year in the Brazilian Amazon between 2004 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        chart: {
          kind: "line",
          title: "Annual deforestation in the Brazilian Amazon",
          unit: "square kilometres cleared per year",
          categories: ["2004", "2008", "2012", "2016", "2020", "2023"],
          series: [
            { name: "Area cleared", values: [27700, 12900, 4600, 7900, 10900, 9100] },
          ],
          source: "INPE PRODES, Brazilian National Institute for Space Research",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "Some people believe that protecting forests should take priority over economic development in the regions where those forests grow. Others argue that development is necessary before conservation can be sustained. Discuss both views and give your own opinion. Write at least 250 words.",
      },
    ],
  },

  {
    id: "W08",
    title: "Mock 08",
    focus: "Health and population",
    tasks: [
      {
        task: 1,
        expects: "data_description",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The chart below shows life expectancy at birth in four regions in 1950 and in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        chart: {
          kind: "bar",
          title: "Life expectancy at birth, 1950 and 2020",
          unit: "years",
          categories: ["World", "Europe", "Asia", "Sub-Saharan Africa"],
          series: [
            { name: "1950", values: [47, 63, 42, 36] },
            { name: "2020", values: [72, 78, 74, 61] },
          ],
          source: "United Nations, World Population Prospects",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "In many countries people are living longer, and the cost of caring for an older population is rising. What problems does this create, and what solutions could governments consider? Write at least 250 words.",
      },
    ],
  },

  {
    id: "W09",
    title: "Mock 09",
    focus: "Power generation",
    tasks: [
      {
        task: 1,
        expects: "data_description",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The table below shows the share of world electricity generation by source in 2000 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        chart: {
          kind: "table",
          title: "Share of world electricity generation by source, %",
          columns: ["Source", "2000", "2023"],
          rows: [
            ["Coal", "38", "35"],
            ["Gas", "18", "23"],
            ["Hydro", "19", "14"],
            ["Nuclear", "17", "9"],
            ["Wind and solar", "0", "13"],
            ["Other renewables", "8", "6"],
          ],
          source: "Ember, Global Electricity Review",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "Some people say that the shift from fossil fuels to renewable energy will be paid for mainly by ordinary households. Others say that the cost is small compared with the cost of doing nothing. Discuss both views and give your own opinion. Write at least 250 words.",
      },
    ],
  },

  {
    id: "W10",
    title: "Mock 10",
    focus: "Materials and reuse",
    tasks: [
      {
        task: 1,
        expects: "process_description",
        minWords: 150,
        suggestedMinutes: 20,
        prompt:
          "The diagram below shows how used paper is turned into new paper. Summarise the information by selecting and reporting the main features. Write at least 150 words.",
        chart: {
          kind: "process",
          title: "From used paper to new paper",
          steps: [
            { label: "Collection", detail: "Used paper is separated by grade at households and offices." },
            { label: "Sorting", detail: "Contaminants such as plastic and metal are removed by hand and by machine." },
            { label: "Pulping", detail: "Paper is mixed with water and broken into fibres in a large tank." },
            { label: "De-inking", detail: "Ink is floated off with air bubbles or washed out." },
            { label: "Screening and cleaning", detail: "Remaining staples, glue and grit are filtered out." },
            { label: "Forming and drying", detail: "The fibre slurry is spread on a wire, pressed and dried into new sheets." },
          ],
          source: "Standard recovered paper recycling process",
        },
      },
      {
        task: 2,
        expects: "argument",
        minWords: 250,
        suggestedMinutes: 40,
        prompt:
          "Many products are now designed to be repaired rather than replaced, and some governments require manufacturers to supply spare parts. What are the benefits of this trend, and what difficulties might it create for manufacturers and consumers? Write at least 250 words.",
      },
    ],
  },
];

export function getWritingMock(id: string): WritingMock {
  return WRITING_MOCKS.find((m) => m.id === id) ?? WRITING_MOCKS[0];
}

export const WRITING_FACTS = {
  mocks: WRITING_MOCKS.length,
  tasksPerMock: 2,
  timing: ["60 minutes for both tasks", "Task 1 at least 150 words", "Task 2 at least 250 words"],
};
