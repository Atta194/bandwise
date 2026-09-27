import type { SpeakingMock } from "../types";

/**
 * Speaking module: ten stored mocks. Every one runs Part 1 questions, a Part 2
 * cue card with preparation time, then Part 3 discussion, in sequence.
 */
export const SPEAKING_MOCKS: SpeakingMock[] = [
  {
    id: "S01",
    title: "Mock 01",
    part1: [
      {
        topic: "Where you live",
        questions: [
          "Do you live in a house or an apartment?",
          "How long have you lived there?",
          "What do you like most about the area you live in?",
          "Would you like to move somewhere else in the future?",
          "Is there anything you would change about your home?",
        ],
      },
      {
        topic: "Books",
        questions: [
          "Do you enjoy reading?",
          "What kind of books did you read as a child?",
          "Do you prefer paper books or screens?",
          "How often do you buy books?",
          "Is there a book you would recommend to a friend?",
        ],
      },
    ],
    part2: {
      topic: "Describe a place you go to when you need to concentrate",
      bullets: [
        "where it is and what it looks like",
        "how often you go there",
        "what you do while you are there",
      ],
      closing: "and explain why this place helps you to concentrate.",
    },
    part3: [
      {
        topic: "Concentration and work",
        questions: [
          "Why do you think some people find it harder to concentrate than others?",
          "Have working habits changed in your country over the last twenty years?",
          "Should employers be responsible for helping staff concentrate?",
          "Do you think open plan offices help or hinder concentration?",
        ],
      },
      {
        topic: "Quiet places",
        questions: [
          "Are there enough quiet public places in your city?",
          "Why do people pay to sit in cafés rather than at home?",
          "How might cities of the future be designed differently for quiet?",
          "Is silence always a good thing?",
        ],
      },
    ],
  },

  {
    id: "S02",
    title: "Mock 02",
    part1: [
      {
        topic: "Work and study",
        questions: [
          "Are you working or studying at the moment?",
          "What made you choose that subject or job?",
          "What is the most interesting part of it?",
          "Would you like to change anything about your daily routine?",
          "What do you plan to do in the next few years?",
        ],
      },
      {
        topic: "Weather",
        questions: [
          "What kind of weather do you like best?",
          "Does the weather affect your mood?",
          "Is the weather in your country predictable?",
          "Do you check the forecast every day?",
          "Have you ever experienced extreme weather?",
        ],
      },
    ],
    part2: {
      topic: "Describe something you learned that was difficult at first",
      bullets: [
        "what you learned",
        "why it was difficult",
        "how you went about learning it",
      ],
      closing: "and explain how you felt when you finally managed it.",
    },
    part3: [
      {
        topic: "Learning and difficulty",
        questions: [
          "Why do some people give up when a task becomes difficult?",
          "Is it better to learn in a classroom or on your own?",
          "Should schools teach students how to deal with failure?",
          "How has the internet changed the way people learn difficult skills?",
        ],
      },
      {
        topic: "Skills and society",
        questions: [
          "Which practical skills should every adult have?",
          "Are employers more interested in qualifications or in skills?",
          "Will many current jobs still need the same skills in twenty years?",
          "Should practical skills be taught at school?",
        ],
      },
    ],
  },

  {
    id: "S03",
    title: "Mock 03",
    part1: [
      {
        topic: "Food",
        questions: [
          "What do you usually eat for breakfast?",
          "Do you enjoy cooking?",
          "Have your eating habits changed in recent years?",
          "Is there a food you dislike?",
          "Do you eat out often?",
        ],
      },
      {
        topic: "Photographs",
        questions: [
          "Do you take many photographs?",
          "What do you do with the photographs you take?",
          "Do you prefer photographs of people or of places?",
          "Has anyone ever taken a photograph that you disliked?",
          "Are printed photographs still important to you?",
        ],
      },
    ],
    part2: {
      topic: "Describe a meal that you remember well",
      bullets: [
        "what the meal was and where you ate it",
        "who you were with",
        "why the meal was memorable",
      ],
      closing: "and explain what the meal meant to you.",
    },
    part3: [
      {
        topic: "Food and culture",
        questions: [
          "Why is food important to cultural identity?",
          "Has fast food changed eating habits in your country?",
          "Should governments regulate what food companies advertise?",
          "Do you think traditional dishes will survive in the next fifty years?",
        ],
      },
      {
        topic: "Food production",
        questions: [
          "How might climate change affect what people eat?",
          "Is it better to buy local food or food that is cheaper?",
          "Should food waste be controlled by law?",
          "What role should schools play in teaching children about food?",
        ],
      },
    ],
  },

  {
    id: "S04",
    title: "Mock 04",
    part1: [
      {
        topic: "Travel",
        questions: [
          "Do you enjoy travelling?",
          "How do you usually travel around your town?",
          "What was the last journey you took?",
          "Do you prefer to plan a trip in detail?",
          "Would you like to travel by train more often?",
        ],
      },
      {
        topic: "Music",
        questions: [
          "What kind of music do you listen to?",
          "When do you usually listen to music?",
          "Can you play an instrument?",
          "Do you have a favourite song at the moment?",
          "Is live music important to you?",
        ],
      },
    ],
    part2: {
      topic: "Describe a journey that did not go as planned",
      bullets: [
        "where you were going",
        "what went wrong",
        "how you dealt with the situation",
      ],
      closing: "and explain what you learned from the experience.",
    },
    part3: [
      {
        topic: "Transport",
        questions: [
          "Why do so many people prefer to drive rather than use public transport?",
          "Should cities restrict cars in their centres?",
          "How might travel change in the next thirty years?",
          "Who should pay for public transport, passengers or taxpayers?",
        ],
      },
      {
        topic: "Planning and change",
        questions: [
          "Are people generally good at dealing with sudden change?",
          "Why do some people dislike planning ahead?",
          "Should organisations insist on rigid plans?",
          "How can companies prepare for unexpected events?",
        ],
      },
    ],
  },

  {
    id: "S05",
    title: "Mock 05",
    part1: [
      {
        topic: "Technology",
        questions: [
          "What device do you use most often?",
          "How much time do you spend online each day?",
          "Is there an app you could not manage without?",
          "Do you think you use technology too much?",
          "How did you learn to use your devices?",
        ],
      },
      {
        topic: "Neighbours",
        questions: [
          "Do you know your neighbours?",
          "How well did you know neighbours where you grew up?",
          "What makes a good neighbour?",
          "Have neighbours ever helped you?",
          "Would you like to know them better?",
        ],
      },
    ],
    part2: {
      topic: "Describe a piece of technology that changed how you work or study",
      bullets: [
        "what the technology is",
        "when you started using it",
        "how you used to work or study before",
      ],
      closing: "and explain how it changed things for you.",
    },
    part3: [
      {
        topic: "Technology and society",
        questions: [
          "Should there be an age limit for using social media?",
          "Has technology made people more or less sociable?",
          "Who should be responsible for the effects of new technology?",
          "What will we need to teach children that we did not need to teach before?",
        ],
      },
      {
        topic: "Community",
        questions: [
          "Why do some neighbourhoods feel more like communities than others?",
          "Has the internet weakened local communities?",
          "What could a city do to bring neighbours together?",
          "Is it a problem if people do not know their neighbours?",
        ],
      },
    ],
  },

  {
    id: "S06",
    title: "Mock 06",
    part1: [
      {
        topic: "Hobbies",
        questions: [
          "What do you do in your free time?",
          "Have you taken up a new hobby recently?",
          "Is there a hobby you would like to try?",
          "Did you have the same hobbies as a child?",
          "Do you prefer doing hobbies alone or in a group?",
        ],
      },
      {
        topic: "Parks and outdoors",
        questions: [
          "Are there parks near where you live?",
          "How often do you spend time outdoors?",
          "What do you like to do outdoors?",
          "Is there enough green space in your area?",
          "Did you play outside as a child?",
        ],
      },
    ],
    part2: {
      topic: "Describe an activity that helps you relax",
      bullets: [
        "what the activity is",
        "when and where you usually do it",
        "whether you do it alone or with others",
      ],
      closing: "and explain why it helps you to relax.",
    },
    part3: [
      {
        topic: "Leisure and pressure",
        questions: [
          "Why do many people say they have no time for leisure?",
          "Should employers do more to protect their staff's free time?",
          "Do hobbies have to be productive to be worthwhile?",
          "How is leisure spent differently by different age groups?",
        ],
      },
      {
        topic: "Public space",
        questions: [
          "What makes a public space successful?",
          "Should governments spend money on parks rather than on roads?",
          "How do public spaces differ between cities and villages?",
          "Are privately owned public spaces a problem?",
        ],
      },
    ],
  },

  {
    id: "S07",
    title: "Mock 07",
    part1: [
      {
        topic: "Shopping",
        questions: [
          "Do you enjoy shopping?",
          "Do you prefer to shop in stores or online?",
          "How often do you buy clothes?",
          "Have your shopping habits changed recently?",
          "Is there something you are saving up for?",
        ],
      },
      {
        topic: "Sleep and time",
        questions: [
          "Are you a morning person or an evening person?",
          "How many hours do you usually sleep?",
          "Do you use an alarm clock?",
          "What do you do in the first hour of the day?",
          "Do you ever feel that you do not have enough time?",
        ],
      },
    ],
    part2: {
      topic: "Describe a decision you made that was difficult",
      bullets: [
        "what the decision was",
        "what the options were",
        "who you spoke to about it",
      ],
      closing: "and explain why you were pleased or disappointed with the result.",
    },
    part3: [
      {
        topic: "Decisions",
        questions: [
          "Do young people make decisions differently from older people?",
          "Should important decisions be made quickly or slowly?",
          "How can people be helped to make better decisions?",
          "Are group decisions better than individual ones?",
        ],
      },
      {
        topic: "Consumption",
        questions: [
          "Why do people buy things they do not need?",
          "Should advertising to children be restricted?",
          "Will shopping habits change in the next twenty years?",
          "Is it possible to live well without buying very much?",
        ],
      },
    ],
  },

  {
    id: "S08",
    title: "Mock 08",
    part1: [
      {
        topic: "Learning languages",
        questions: [
          "How many languages do you speak?",
          "When did you start learning English?",
          "What is the hardest part of learning a language?",
          "Do you use English outside your studies or work?",
          "Which language would you like to learn next?",
        ],
      },
      {
        topic: "Gifts",
        questions: [
          "Do you enjoy giving presents?",
          "What was the best present you have received?",
          "Is it difficult to choose a present for someone?",
          "Do you prefer to choose a present yourself or to be given money?",
          "Are presents important at festivals in your country?",
        ],
      },
    ],
    part2: {
      topic: "Describe a teacher or instructor who influenced you",
      bullets: [
        "who the person was",
        "what they taught you",
        "what was different about their approach",
      ],
      closing: "and explain how they influenced what you did afterwards.",
    },
    part3: [
      {
        topic: "Teaching",
        questions: [
          "What makes a good teacher?",
          "Has the role of the teacher changed in recent years?",
          "Should teachers be paid according to how well their students do?",
          "Can good teaching be learned, or is it a natural ability?",
        ],
      },
      {
        topic: "Education systems",
        questions: [
          "Should students be tested as often as they are?",
          "Which subjects should be compulsory in every country?",
          "How should education adapt to a changing job market?",
          "Is university the right path for everyone?",
        ],
      },
    ],
  },

  {
    id: "S09",
    title: "Mock 09",
    part1: [
      {
        topic: "Your town",
        questions: [
          "Where did you grow up?",
          "What do you like about that place?",
          "Has it changed much since you were a child?",
          "Would you recommend visiting it?",
          "Do you still have friends there?",
        ],
      },
      {
        topic: "Clothes",
        questions: [
          "What kind of clothes do you usually wear?",
          "Do you choose clothes for comfort or for style?",
          "Have you ever made your own clothes?",
          "Are clothes expensive where you live?",
          "Do you keep clothes for a long time?",
        ],
      },
    ],
    part2: {
      topic: "Describe a public place in your town that you would change",
      bullets: [
        "what the place is and where it is",
        "what is wrong with it now",
        "who uses it",
      ],
      closing: "and explain how you would change it.",
    },
    part3: [
      {
        topic: "Cities and change",
        questions: [
          "Who should decide how a city changes?",
          "Why do some people oppose new development in their area?",
          "How can planners involve local people in decisions?",
          "Should historic buildings always be preserved?",
        ],
      },
      {
        topic: "Belonging",
        questions: [
          "What makes people feel they belong to a place?",
          "Do people move house more often than they used to?",
          "How does moving to a new city affect people?",
          "Can a city have too many newcomers?",
        ],
      },
    ],
  },

  {
    id: "S10",
    title: "Mock 10",
    part1: [
      {
        topic: "Daily routine",
        questions: [
          "What time do you usually get up?",
          "What is the busiest part of your day?",
          "Do you have the same routine at weekends?",
          "Would you like to change your routine?",
          "What helps you stay organised?",
        ],
      },
      {
        topic: "Numbers and money",
        questions: [
          "Are you good with numbers?",
          "Do you keep a budget?",
          "Did anyone teach you about money when you were young?",
          "Do you prefer to pay in cash or by card?",
          "Have prices changed much where you live?",
        ],
      },
    ],
    part2: {
      topic: "Describe a piece of advice that was useful to you",
      bullets: [
        "what the advice was",
        "who gave it to you",
        "why you needed it at the time",
      ],
      closing: "and explain how you used it afterwards.",
    },
    part3: [
      {
        topic: "Advice",
        questions: [
          "Do people take advice more often from friends or from experts?",
          "Why is advice sometimes ignored?",
          "Should companies be required to give financial advice to customers?",
          "Is it possible to give good advice without knowing the person well?",
        ],
      },
      {
        topic: "Money and society",
        questions: [
          "Should financial education be a school subject?",
          "Why do some people find it hard to save?",
          "Is debt always a bad thing?",
          "How might a cashless society affect different groups of people?",
        ],
      },
    ],
  },
];

export function getSpeakingMock(id: string): SpeakingMock {
  return SPEAKING_MOCKS.find((m) => m.id === id) ?? SPEAKING_MOCKS[0];
}

export const SPEAKING_FACTS = {
  mocks: SPEAKING_MOCKS.length,
  timing: [
    "Part 1 up to 1 minute per answer",
    "Part 2 one minute to prepare, up to 2 minutes to speak",
    "Part 3 up to 1 minute per answer",
  ],
};
