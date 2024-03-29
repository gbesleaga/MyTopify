/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 */

import { Injectable } from '@angular/core';
import { Item, Period, Category } from 'spotify-lib';
import { GameKnowledgeBase, Question, Difficulty } from '../shared/types';

const MINIMUM_CATEGORY_SIZE = 20;

@Injectable({providedIn: 'root'})
export class QuestionGeneratorService {

  private nQuestions = 24;
  private questions: Question[] | null = null;


  generateQuestions(gameKnowledgeBase: GameKnowledgeBase): Question[] | null {
    this.questions = [];

    // check which categories are valid from the selected categories
    let categories = gameKnowledgeBase.getCategories();

    const validCategories = [];

    for (const cat of categories) {
      if (gameKnowledgeBase.getCategorySize(cat) >= MINIMUM_CATEGORY_SIZE) {
        validCategories.push(cat);
      }
    }

    categories = validCategories;

    if (categories.length === 0) {
      return null;
    }

    // distribute questions evenly by category
    const nQuestionsPerCat = this.nQuestions / categories.length;
    
    const questionsLeftPerCategory = [];

    for (let i = 0; i < categories.length; ++i) {
      questionsLeftPerCategory.push(nQuestionsPerCat);
    }

    const questionDifficultyDistr = this.getQuestionDistribution();

    for (const difficulty of questionDifficultyDistr) {
      // pick a random category
      const c = this.getNextCategory(questionsLeftPerCategory);

      if (c < 0) {
        break;
      }

      // generate question with appropriate difficulty
      this.questions.push(this.generateQuestion(categories[c], difficulty, gameKnowledgeBase));
    }

    return this.questions;
  }


  private getQuestionDistribution(): Difficulty[] {
    // we think of the difficulty distribution as a series of pairs of 2 waves
    // first wave in the pair is easier, second is harder
    // and overall difficulty increases with each pair
    return [Difficulty.Easy,   Difficulty.Easy,   Difficulty.Easy,   Difficulty.Easy, 
            Difficulty.Medium, Difficulty.Medium, Difficulty.Medium, Difficulty.Hard,
            Difficulty.Easy,   Difficulty.Easy,   Difficulty.Easy,   Difficulty.Medium,
            Difficulty.Medium, Difficulty.Medium, Difficulty.Hard,   Difficulty.Hard,
            Difficulty.Easy,   Difficulty.Medium, Difficulty.Medium, Difficulty.Hard,
            Difficulty.Hard,   Difficulty.Hard,   Difficulty.Hard,   Difficulty.Hard];
  }


  /**
   * Get a random category from the categories that still have questions left
   */
  private getNextCategory(categoryQuestions: number[]): number {
    if (categoryQuestions.length === 0 || categoryQuestions.every(item => item === 0)) {
      return -1;
    }

    let c = this.generateRandomNumber(0, categoryQuestions.length - 1);
    
    while (categoryQuestions[c] === 0) {
      c = this.generateRandomNumber(0, categoryQuestions.length - 1);
    }

    categoryQuestions[c]--;

    return c;
  }


  private generateQuestion(category: Category, difficulty: Difficulty, gameKnowledgeBase: GameKnowledgeBase): Question {
    let question: Question;

    switch (difficulty) {
      case Difficulty.Easy:
        question = this.generateEasyQuestion(category, gameKnowledgeBase);
        break;
      
      case Difficulty.Medium:
        question = this.generateMediumQuestion(category, gameKnowledgeBase);
        break;

      case Difficulty.Hard:
        question = this.generateHardQuestion(category, gameKnowledgeBase);
        break;

      default:
        question = this.generateEasyQuestion(category, gameKnowledgeBase);
        break;
    }

    this.generateTextForQuestion(question);

    return question;
  }

  private generateEasyQuestion(category: Category, gameKnowledgeBase: GameKnowledgeBase): Question {
    // easy = items are far apart in the category
    const q = this.generateQuestionInRange(6, 9, category, gameKnowledgeBase);

    q.difficulty = Difficulty.Easy;

    return q;
  }


  private generateMediumQuestion(category: Category, gameKnowledgeBase: GameKnowledgeBase): Question {
    // medium = items are somewhat close in the category
    const q = this.generateQuestionInRange(3, 5, category, gameKnowledgeBase);

    q.difficulty = Difficulty.Medium;

    return q;
  }


  private generateHardQuestion(category: Category, gameKnowledgeBase: GameKnowledgeBase): Question {
    // hard = items are very close in the category
    const q = this.generateQuestionInRange(1, 2, category, gameKnowledgeBase);

    q.difficulty = Difficulty.Hard;

    return q;
  }


  /**
   * generate a question with items from given category
   * the distance between the 2 items in the category is between min and max
   */
  private generateQuestionInRange(min: number, max: number, cat: Category, gameKnowledgeBase: GameKnowledgeBase): Question {
    // pivot
    const catSize = gameKnowledgeBase.getCategorySize(cat);
    const left = this.generateRandomNumber(0, catSize - 1);
    const i = this.generateRandomNumber(min, max);
    const s = this.generateRandomSign();
    let right = left + s * i;

    if (right < 0 || right >= catSize) {
      right = left - s * i;
    }

    const question = {
      category: cat,
      difficulty: Difficulty.Unknown, // will be set later
    
      iLeft: left,
      iRight: right,
      answer: right > left ? left : right,

      text: "", // will be set later
    };

    return question;
  }


  private generateRandomNumber(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  private generateRandomSign(): number {
    const s = this.generateRandomNumber(0, 1);

    if (s === 0) {
      return -1;
    } else {
      return 1;
    }
  }


  private generateTextForQuestion(question: Question) {
    let questionText = 'Which ';

    questionText += '<b>';
    switch (question.category.type) {
      case Item.Artist:
        questionText += 'artist';
        break;

      case Item.Track:
        questionText += 'track';
        break;
    }
    questionText += '</b>';

    questionText += ' have you listened more to ';

    switch (question.category.period) {
      case Period.ShortTerm:
        questionText += 'in the last 4 weeks';
        break;

      case Period.MediumTerm:
        questionText += 'in the last 6 months';
        break;

      case Period.LongTerm:
        questionText += 'all time';
        break;
    }

    questionText += '?';

    question.text = questionText;
  }
}
