/**
 * The $1 Unistroke Recognizer (JavaScript version)
 *
 *	Jacob O. Wobbrock, Ph.D.
 * 	The Information School
 *	University of Washington
 *	Seattle, WA 98195-2840
 *	wobbrock@uw.edu
 *
 *	Andrew D. Wilson, Ph.D.
 *	Microsoft Research
 *	One Microsoft Way
 *	Redmond, WA 98052
 *	awilson@microsoft.com
 *
 *	Yang Li, Ph.D.
 *	Department of Computer Science and Engineering
 * 	University of Washington
 *	Seattle, WA 98195-2840
 * 	yangli@cs.washington.edu
 *
 * The academic publication for the $1 recognizer, and what should be 
 * used to cite it, is:
 *
 *	Wobbrock, J.O., Wilson, A.D. and Li, Y. (2007). Gestures without 
 *	  libraries, toolkits or training: A $1 recognizer for user interface 
 *	  prototypes. Proceedings of the ACM Symposium on User Interface 
 *	  Software and Technology (UIST '07). Newport, Rhode Island (October 
 *	  7-10, 2007). New York: ACM Press, pp. 159-168.
 *
 * The Protractor enhancement was separately published by Yang Li and programmed 
 * here by Jacob O. Wobbrock:
 *
 *	Li, Y. (2010). Protractor: A fast and accurate gesture
 *	  recognizer. Proceedings of the ACM Conference on Human
 *	  Factors in Computing Systems (CHI '10). Atlanta, Georgia
 *	  (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2007-2012, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University of Washington nor Microsoft,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Andrew D. Wilson
 * OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/
//
// dPoint class
//
function dPoint(x, y) // constructor
{
	this.X = x;
	this.Y = y;
}
//
// Rectangle class
//
function Rectangle(x, y, width, height) // constructor
{
	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;
}
//
// Unistroke class: a unistroke template
//
function Unistroke(name, points) // constructor
{
	this.Name = name;
	this.Points = Resample(points, NumPoints);
	var radians = IndicativeAngle(this.Points);
	this.Points = RotateBy(this.Points, -radians);
	this.Points = ScaleTo(this.Points, SquareSize);
	this.Points = TranslateTo(this.Points, Origin);
	this.Vector = Vectorize(this.Points); // for Protractor
}
//
// Result class
//
function Result(name, score) // constructor
{
	this.Name = name;
	this.Score = score;
}
//
// DollarRecognizer class constants
//
var NumUnistrokes = 16;
var NumPoints = 64;
var SquareSize = 250.0;
var Origin = new dPoint(0,0);
var Diagonal = Math.sqrt(SquareSize * SquareSize + SquareSize * SquareSize);
var HalfDiagonal = 0.5 * Diagonal;
var AngleRange = Deg2Rad(45.0);
var AnglePrecision = Deg2Rad(2.0);
var Phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio
//
// DollarRecognizer class
//
function DollarRecognizer() // constructor
{
	//
	// one built-in unistroke per gesture type
	//
	this.Unistrokes = new Array(NumUnistrokes);
	this.Unistrokes[0] = new Unistroke("triangle", new Array(new dPoint(137,139),new dPoint(135,141),new dPoint(133,144),new dPoint(132,146),new dPoint(130,149),new dPoint(128,151),new dPoint(126,155),new dPoint(123,160),new dPoint(120,166),new dPoint(116,171),new dPoint(112,177),new dPoint(107,183),new dPoint(102,188),new dPoint(100,191),new dPoint(95,195),new dPoint(90,199),new dPoint(86,203),new dPoint(82,206),new dPoint(80,209),new dPoint(75,213),new dPoint(73,213),new dPoint(70,216),new dPoint(67,219),new dPoint(64,221),new dPoint(61,223),new dPoint(60,225),new dPoint(62,226),new dPoint(65,225),new dPoint(67,226),new dPoint(74,226),new dPoint(77,227),new dPoint(85,229),new dPoint(91,230),new dPoint(99,231),new dPoint(108,232),new dPoint(116,233),new dPoint(125,233),new dPoint(134,234),new dPoint(145,233),new dPoint(153,232),new dPoint(160,233),new dPoint(170,234),new dPoint(177,235),new dPoint(179,236),new dPoint(186,237),new dPoint(193,238),new dPoint(198,239),new dPoint(200,237),new dPoint(202,239),new dPoint(204,238),new dPoint(206,234),new dPoint(205,230),new dPoint(202,222),new dPoint(197,216),new dPoint(192,207),new dPoint(186,198),new dPoint(179,189),new dPoint(174,183),new dPoint(170,178),new dPoint(164,171),new dPoint(161,168),new dPoint(154,160),new dPoint(148,155),new dPoint(143,150),new dPoint(138,148),new dPoint(136,148)));
	this.Unistrokes[1] = new Unistroke("x", new Array(new dPoint(87,142),new dPoint(89,145),new dPoint(91,148),new dPoint(93,151),new dPoint(96,155),new dPoint(98,157),new dPoint(100,160),new dPoint(102,162),new dPoint(106,167),new dPoint(108,169),new dPoint(110,171),new dPoint(115,177),new dPoint(119,183),new dPoint(123,189),new dPoint(127,193),new dPoint(129,196),new dPoint(133,200),new dPoint(137,206),new dPoint(140,209),new dPoint(143,212),new dPoint(146,215),new dPoint(151,220),new dPoint(153,222),new dPoint(155,223),new dPoint(157,225),new dPoint(158,223),new dPoint(157,218),new dPoint(155,211),new dPoint(154,208),new dPoint(152,200),new dPoint(150,189),new dPoint(148,179),new dPoint(147,170),new dPoint(147,158),new dPoint(147,148),new dPoint(147,141),new dPoint(147,136),new dPoint(144,135),new dPoint(142,137),new dPoint(140,139),new dPoint(135,145),new dPoint(131,152),new dPoint(124,163),new dPoint(116,177),new dPoint(108,191),new dPoint(100,206),new dPoint(94,217),new dPoint(91,222),new dPoint(89,225),new dPoint(87,226),new dPoint(87,224)));
	this.Unistrokes[2] = new Unistroke("rectangle", new Array(new dPoint(78,149),new dPoint(78,153),new dPoint(78,157),new dPoint(78,160),new dPoint(79,162),new dPoint(79,164),new dPoint(79,167),new dPoint(79,169),new dPoint(79,173),new dPoint(79,178),new dPoint(79,183),new dPoint(80,189),new dPoint(80,193),new dPoint(80,198),new dPoint(80,202),new dPoint(81,208),new dPoint(81,210),new dPoint(81,216),new dPoint(82,222),new dPoint(82,224),new dPoint(82,227),new dPoint(83,229),new dPoint(83,231),new dPoint(85,230),new dPoint(88,232),new dPoint(90,233),new dPoint(92,232),new dPoint(94,233),new dPoint(99,232),new dPoint(102,233),new dPoint(106,233),new dPoint(109,234),new dPoint(117,235),new dPoint(123,236),new dPoint(126,236),new dPoint(135,237),new dPoint(142,238),new dPoint(145,238),new dPoint(152,238),new dPoint(154,239),new dPoint(165,238),new dPoint(174,237),new dPoint(179,236),new dPoint(186,235),new dPoint(191,235),new dPoint(195,233),new dPoint(197,233),new dPoint(200,233),new dPoint(201,235),new dPoint(201,233),new dPoint(199,231),new dPoint(198,226),new dPoint(198,220),new dPoint(196,207),new dPoint(195,195),new dPoint(195,181),new dPoint(195,173),new dPoint(195,163),new dPoint(194,155),new dPoint(192,145),new dPoint(192,143),new dPoint(192,138),new dPoint(191,135),new dPoint(191,133),new dPoint(191,130),new dPoint(190,128),new dPoint(188,129),new dPoint(186,129),new dPoint(181,132),new dPoint(173,131),new dPoint(162,131),new dPoint(151,132),new dPoint(149,132),new dPoint(138,132),new dPoint(136,132),new dPoint(122,131),new dPoint(120,131),new dPoint(109,130),new dPoint(107,130),new dPoint(90,132),new dPoint(81,133),new dPoint(76,133)));
	this.Unistrokes[3] = new Unistroke("circle", new Array(new dPoint(127,141),new dPoint(124,140),new dPoint(120,139),new dPoint(118,139),new dPoint(116,139),new dPoint(111,140),new dPoint(109,141),new dPoint(104,144),new dPoint(100,147),new dPoint(96,152),new dPoint(93,157),new dPoint(90,163),new dPoint(87,169),new dPoint(85,175),new dPoint(83,181),new dPoint(82,190),new dPoint(82,195),new dPoint(83,200),new dPoint(84,205),new dPoint(88,213),new dPoint(91,216),new dPoint(96,219),new dPoint(103,222),new dPoint(108,224),new dPoint(111,224),new dPoint(120,224),new dPoint(133,223),new dPoint(142,222),new dPoint(152,218),new dPoint(160,214),new dPoint(167,210),new dPoint(173,204),new dPoint(178,198),new dPoint(179,196),new dPoint(182,188),new dPoint(182,177),new dPoint(178,167),new dPoint(170,150),new dPoint(163,138),new dPoint(152,130),new dPoint(143,129),new dPoint(140,131),new dPoint(129,136),new dPoint(126,139)));
	this.Unistrokes[4] = new Unistroke("check", new Array(new dPoint(91,185),new dPoint(93,185),new dPoint(95,185),new dPoint(97,185),new dPoint(100,188),new dPoint(102,189),new dPoint(104,190),new dPoint(106,193),new dPoint(108,195),new dPoint(110,198),new dPoint(112,201),new dPoint(114,204),new dPoint(115,207),new dPoint(117,210),new dPoint(118,212),new dPoint(120,214),new dPoint(121,217),new dPoint(122,219),new dPoint(123,222),new dPoint(124,224),new dPoint(126,226),new dPoint(127,229),new dPoint(129,231),new dPoint(130,233),new dPoint(129,231),new dPoint(129,228),new dPoint(129,226),new dPoint(129,224),new dPoint(129,221),new dPoint(129,218),new dPoint(129,212),new dPoint(129,208),new dPoint(130,198),new dPoint(132,189),new dPoint(134,182),new dPoint(137,173),new dPoint(143,164),new dPoint(147,157),new dPoint(151,151),new dPoint(155,144),new dPoint(161,137),new dPoint(165,131),new dPoint(171,122),new dPoint(174,118),new dPoint(176,114),new dPoint(177,112),new dPoint(177,114),new dPoint(175,116),new dPoint(173,118)));
	this.Unistrokes[5] = new Unistroke("caret", new Array(new dPoint(79,245),new dPoint(79,242),new dPoint(79,239),new dPoint(80,237),new dPoint(80,234),new dPoint(81,232),new dPoint(82,230),new dPoint(84,224),new dPoint(86,220),new dPoint(86,218),new dPoint(87,216),new dPoint(88,213),new dPoint(90,207),new dPoint(91,202),new dPoint(92,200),new dPoint(93,194),new dPoint(94,192),new dPoint(96,189),new dPoint(97,186),new dPoint(100,179),new dPoint(102,173),new dPoint(105,165),new dPoint(107,160),new dPoint(109,158),new dPoint(112,151),new dPoint(115,144),new dPoint(117,139),new dPoint(119,136),new dPoint(119,134),new dPoint(120,132),new dPoint(121,129),new dPoint(122,127),new dPoint(124,125),new dPoint(126,124),new dPoint(129,125),new dPoint(131,127),new dPoint(132,130),new dPoint(136,139),new dPoint(141,154),new dPoint(145,166),new dPoint(151,182),new dPoint(156,193),new dPoint(157,196),new dPoint(161,209),new dPoint(162,211),new dPoint(167,223),new dPoint(169,229),new dPoint(170,231),new dPoint(173,237),new dPoint(176,242),new dPoint(177,244),new dPoint(179,250),new dPoint(181,255),new dPoint(182,257)));
	this.Unistrokes[6] = new Unistroke("zig-zag", new Array(new dPoint(307,216),new dPoint(333,186),new dPoint(356,215),new dPoint(375,186),new dPoint(399,216),new dPoint(418,186)));
	this.Unistrokes[7] = new Unistroke("arrow", new Array(new dPoint(68,222),new dPoint(70,220),new dPoint(73,218),new dPoint(75,217),new dPoint(77,215),new dPoint(80,213),new dPoint(82,212),new dPoint(84,210),new dPoint(87,209),new dPoint(89,208),new dPoint(92,206),new dPoint(95,204),new dPoint(101,201),new dPoint(106,198),new dPoint(112,194),new dPoint(118,191),new dPoint(124,187),new dPoint(127,186),new dPoint(132,183),new dPoint(138,181),new dPoint(141,180),new dPoint(146,178),new dPoint(154,173),new dPoint(159,171),new dPoint(161,170),new dPoint(166,167),new dPoint(168,167),new dPoint(171,166),new dPoint(174,164),new dPoint(177,162),new dPoint(180,160),new dPoint(182,158),new dPoint(183,156),new dPoint(181,154),new dPoint(178,153),new dPoint(171,153),new dPoint(164,153),new dPoint(160,153),new dPoint(150,154),new dPoint(147,155),new dPoint(141,157),new dPoint(137,158),new dPoint(135,158),new dPoint(137,158),new dPoint(140,157),new dPoint(143,156),new dPoint(151,154),new dPoint(160,152),new dPoint(170,149),new dPoint(179,147),new dPoint(185,145),new dPoint(192,144),new dPoint(196,144),new dPoint(198,144),new dPoint(200,144),new dPoint(201,147),new dPoint(199,149),new dPoint(194,157),new dPoint(191,160),new dPoint(186,167),new dPoint(180,176),new dPoint(177,179),new dPoint(171,187),new dPoint(169,189),new dPoint(165,194),new dPoint(164,196)));
	this.Unistrokes[8] = new Unistroke("left square bracket", new Array(new dPoint(140,124),new dPoint(138,123),new dPoint(135,122),new dPoint(133,123),new dPoint(130,123),new dPoint(128,124),new dPoint(125,125),new dPoint(122,124),new dPoint(120,124),new dPoint(118,124),new dPoint(116,125),new dPoint(113,125),new dPoint(111,125),new dPoint(108,124),new dPoint(106,125),new dPoint(104,125),new dPoint(102,124),new dPoint(100,123),new dPoint(98,123),new dPoint(95,124),new dPoint(93,123),new dPoint(90,124),new dPoint(88,124),new dPoint(85,125),new dPoint(83,126),new dPoint(81,127),new dPoint(81,129),new dPoint(82,131),new dPoint(82,134),new dPoint(83,138),new dPoint(84,141),new dPoint(84,144),new dPoint(85,148),new dPoint(85,151),new dPoint(86,156),new dPoint(86,160),new dPoint(86,164),new dPoint(86,168),new dPoint(87,171),new dPoint(87,175),new dPoint(87,179),new dPoint(87,182),new dPoint(87,186),new dPoint(88,188),new dPoint(88,195),new dPoint(88,198),new dPoint(88,201),new dPoint(88,207),new dPoint(89,211),new dPoint(89,213),new dPoint(89,217),new dPoint(89,222),new dPoint(88,225),new dPoint(88,229),new dPoint(88,231),new dPoint(88,233),new dPoint(88,235),new dPoint(89,237),new dPoint(89,240),new dPoint(89,242),new dPoint(91,241),new dPoint(94,241),new dPoint(96,240),new dPoint(98,239),new dPoint(105,240),new dPoint(109,240),new dPoint(113,239),new dPoint(116,240),new dPoint(121,239),new dPoint(130,240),new dPoint(136,237),new dPoint(139,237),new dPoint(144,238),new dPoint(151,237),new dPoint(157,236),new dPoint(159,237)));
	this.Unistrokes[9] = new Unistroke("right square bracket", new Array(new dPoint(112,138),new dPoint(112,136),new dPoint(115,136),new dPoint(118,137),new dPoint(120,136),new dPoint(123,136),new dPoint(125,136),new dPoint(128,136),new dPoint(131,136),new dPoint(134,135),new dPoint(137,135),new dPoint(140,134),new dPoint(143,133),new dPoint(145,132),new dPoint(147,132),new dPoint(149,132),new dPoint(152,132),new dPoint(153,134),new dPoint(154,137),new dPoint(155,141),new dPoint(156,144),new dPoint(157,152),new dPoint(158,161),new dPoint(160,170),new dPoint(162,182),new dPoint(164,192),new dPoint(166,200),new dPoint(167,209),new dPoint(168,214),new dPoint(168,216),new dPoint(169,221),new dPoint(169,223),new dPoint(169,228),new dPoint(169,231),new dPoint(166,233),new dPoint(164,234),new dPoint(161,235),new dPoint(155,236),new dPoint(147,235),new dPoint(140,233),new dPoint(131,233),new dPoint(124,233),new dPoint(117,235),new dPoint(114,238),new dPoint(112,238)));
	this.Unistrokes[10] = new Unistroke("v", new Array(new dPoint(89,164),new dPoint(90,162),new dPoint(92,162),new dPoint(94,164),new dPoint(95,166),new dPoint(96,169),new dPoint(97,171),new dPoint(99,175),new dPoint(101,178),new dPoint(103,182),new dPoint(106,189),new dPoint(108,194),new dPoint(111,199),new dPoint(114,204),new dPoint(117,209),new dPoint(119,214),new dPoint(122,218),new dPoint(124,222),new dPoint(126,225),new dPoint(128,228),new dPoint(130,229),new dPoint(133,233),new dPoint(134,236),new dPoint(136,239),new dPoint(138,240),new dPoint(139,242),new dPoint(140,244),new dPoint(142,242),new dPoint(142,240),new dPoint(142,237),new dPoint(143,235),new dPoint(143,233),new dPoint(145,229),new dPoint(146,226),new dPoint(148,217),new dPoint(149,208),new dPoint(149,205),new dPoint(151,196),new dPoint(151,193),new dPoint(153,182),new dPoint(155,172),new dPoint(157,165),new dPoint(159,160),new dPoint(162,155),new dPoint(164,150),new dPoint(165,148),new dPoint(166,146)));
	this.Unistrokes[11] = new Unistroke("delete", new Array(new dPoint(123,129),new dPoint(123,131),new dPoint(124,133),new dPoint(125,136),new dPoint(127,140),new dPoint(129,142),new dPoint(133,148),new dPoint(137,154),new dPoint(143,158),new dPoint(145,161),new dPoint(148,164),new dPoint(153,170),new dPoint(158,176),new dPoint(160,178),new dPoint(164,183),new dPoint(168,188),new dPoint(171,191),new dPoint(175,196),new dPoint(178,200),new dPoint(180,202),new dPoint(181,205),new dPoint(184,208),new dPoint(186,210),new dPoint(187,213),new dPoint(188,215),new dPoint(186,212),new dPoint(183,211),new dPoint(177,208),new dPoint(169,206),new dPoint(162,205),new dPoint(154,207),new dPoint(145,209),new dPoint(137,210),new dPoint(129,214),new dPoint(122,217),new dPoint(118,218),new dPoint(111,221),new dPoint(109,222),new dPoint(110,219),new dPoint(112,217),new dPoint(118,209),new dPoint(120,207),new dPoint(128,196),new dPoint(135,187),new dPoint(138,183),new dPoint(148,167),new dPoint(157,153),new dPoint(163,145),new dPoint(165,142),new dPoint(172,133),new dPoint(177,127),new dPoint(179,127),new dPoint(180,125)));
	this.Unistrokes[12] = new Unistroke("left curly brace", new Array(new dPoint(150,116),new dPoint(147,117),new dPoint(145,116),new dPoint(142,116),new dPoint(139,117),new dPoint(136,117),new dPoint(133,118),new dPoint(129,121),new dPoint(126,122),new dPoint(123,123),new dPoint(120,125),new dPoint(118,127),new dPoint(115,128),new dPoint(113,129),new dPoint(112,131),new dPoint(113,134),new dPoint(115,134),new dPoint(117,135),new dPoint(120,135),new dPoint(123,137),new dPoint(126,138),new dPoint(129,140),new dPoint(135,143),new dPoint(137,144),new dPoint(139,147),new dPoint(141,149),new dPoint(140,152),new dPoint(139,155),new dPoint(134,159),new dPoint(131,161),new dPoint(124,166),new dPoint(121,166),new dPoint(117,166),new dPoint(114,167),new dPoint(112,166),new dPoint(114,164),new dPoint(116,163),new dPoint(118,163),new dPoint(120,162),new dPoint(122,163),new dPoint(125,164),new dPoint(127,165),new dPoint(129,166),new dPoint(130,168),new dPoint(129,171),new dPoint(127,175),new dPoint(125,179),new dPoint(123,184),new dPoint(121,190),new dPoint(120,194),new dPoint(119,199),new dPoint(120,202),new dPoint(123,207),new dPoint(127,211),new dPoint(133,215),new dPoint(142,219),new dPoint(148,220),new dPoint(151,221)));
	this.Unistrokes[13] = new Unistroke("right curly brace", new Array(new dPoint(117,132),new dPoint(115,132),new dPoint(115,129),new dPoint(117,129),new dPoint(119,128),new dPoint(122,127),new dPoint(125,127),new dPoint(127,127),new dPoint(130,127),new dPoint(133,129),new dPoint(136,129),new dPoint(138,130),new dPoint(140,131),new dPoint(143,134),new dPoint(144,136),new dPoint(145,139),new dPoint(145,142),new dPoint(145,145),new dPoint(145,147),new dPoint(145,149),new dPoint(144,152),new dPoint(142,157),new dPoint(141,160),new dPoint(139,163),new dPoint(137,166),new dPoint(135,167),new dPoint(133,169),new dPoint(131,172),new dPoint(128,173),new dPoint(126,176),new dPoint(125,178),new dPoint(125,180),new dPoint(125,182),new dPoint(126,184),new dPoint(128,187),new dPoint(130,187),new dPoint(132,188),new dPoint(135,189),new dPoint(140,189),new dPoint(145,189),new dPoint(150,187),new dPoint(155,186),new dPoint(157,185),new dPoint(159,184),new dPoint(156,185),new dPoint(154,185),new dPoint(149,185),new dPoint(145,187),new dPoint(141,188),new dPoint(136,191),new dPoint(134,191),new dPoint(131,192),new dPoint(129,193),new dPoint(129,195),new dPoint(129,197),new dPoint(131,200),new dPoint(133,202),new dPoint(136,206),new dPoint(139,211),new dPoint(142,215),new dPoint(145,220),new dPoint(147,225),new dPoint(148,231),new dPoint(147,239),new dPoint(144,244),new dPoint(139,248),new dPoint(134,250),new dPoint(126,253),new dPoint(119,253),new dPoint(115,253)));
	this.Unistrokes[14] = new Unistroke("star", new Array(new dPoint(75,250),new dPoint(75,247),new dPoint(77,244),new dPoint(78,242),new dPoint(79,239),new dPoint(80,237),new dPoint(82,234),new dPoint(82,232),new dPoint(84,229),new dPoint(85,225),new dPoint(87,222),new dPoint(88,219),new dPoint(89,216),new dPoint(91,212),new dPoint(92,208),new dPoint(94,204),new dPoint(95,201),new dPoint(96,196),new dPoint(97,194),new dPoint(98,191),new dPoint(100,185),new dPoint(102,178),new dPoint(104,173),new dPoint(104,171),new dPoint(105,164),new dPoint(106,158),new dPoint(107,156),new dPoint(107,152),new dPoint(108,145),new dPoint(109,141),new dPoint(110,139),new dPoint(112,133),new dPoint(113,131),new dPoint(116,127),new dPoint(117,125),new dPoint(119,122),new dPoint(121,121),new dPoint(123,120),new dPoint(125,122),new dPoint(125,125),new dPoint(127,130),new dPoint(128,133),new dPoint(131,143),new dPoint(136,153),new dPoint(140,163),new dPoint(144,172),new dPoint(145,175),new dPoint(151,189),new dPoint(156,201),new dPoint(161,213),new dPoint(166,225),new dPoint(169,233),new dPoint(171,236),new dPoint(174,243),new dPoint(177,247),new dPoint(178,249),new dPoint(179,251),new dPoint(180,253),new dPoint(180,255),new dPoint(179,257),new dPoint(177,257),new dPoint(174,255),new dPoint(169,250),new dPoint(164,247),new dPoint(160,245),new dPoint(149,238),new dPoint(138,230),new dPoint(127,221),new dPoint(124,220),new dPoint(112,212),new dPoint(110,210),new dPoint(96,201),new dPoint(84,195),new dPoint(74,190),new dPoint(64,182),new dPoint(55,175),new dPoint(51,172),new dPoint(49,170),new dPoint(51,169),new dPoint(56,169),new dPoint(66,169),new dPoint(78,168),new dPoint(92,166),new dPoint(107,164),new dPoint(123,161),new dPoint(140,162),new dPoint(156,162),new dPoint(171,160),new dPoint(173,160),new dPoint(186,160),new dPoint(195,160),new dPoint(198,161),new dPoint(203,163),new dPoint(208,163),new dPoint(206,164),new dPoint(200,167),new dPoint(187,172),new dPoint(174,179),new dPoint(172,181),new dPoint(153,192),new dPoint(137,201),new dPoint(123,211),new dPoint(112,220),new dPoint(99,229),new dPoint(90,237),new dPoint(80,244),new dPoint(73,250),new dPoint(69,254),new dPoint(69,252)));
	this.Unistrokes[15] = new Unistroke("pigtail", new Array(new dPoint(81,219),new dPoint(84,218),new dPoint(86,220),new dPoint(88,220),new dPoint(90,220),new dPoint(92,219),new dPoint(95,220),new dPoint(97,219),new dPoint(99,220),new dPoint(102,218),new dPoint(105,217),new dPoint(107,216),new dPoint(110,216),new dPoint(113,214),new dPoint(116,212),new dPoint(118,210),new dPoint(121,208),new dPoint(124,205),new dPoint(126,202),new dPoint(129,199),new dPoint(132,196),new dPoint(136,191),new dPoint(139,187),new dPoint(142,182),new dPoint(144,179),new dPoint(146,174),new dPoint(148,170),new dPoint(149,168),new dPoint(151,162),new dPoint(152,160),new dPoint(152,157),new dPoint(152,155),new dPoint(152,151),new dPoint(152,149),new dPoint(152,146),new dPoint(149,142),new dPoint(148,139),new dPoint(145,137),new dPoint(141,135),new dPoint(139,135),new dPoint(134,136),new dPoint(130,140),new dPoint(128,142),new dPoint(126,145),new dPoint(122,150),new dPoint(119,158),new dPoint(117,163),new dPoint(115,170),new dPoint(114,175),new dPoint(117,184),new dPoint(120,190),new dPoint(125,199),new dPoint(129,203),new dPoint(133,208),new dPoint(138,213),new dPoint(145,215),new dPoint(155,218),new dPoint(164,219),new dPoint(166,219),new dPoint(177,219),new dPoint(182,218),new dPoint(192,216),new dPoint(196,213),new dPoint(199,212),new dPoint(201,211)));
	//
	// The $1 Gesture Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), and DeleteUserGestures()
	//
	this.Recognize = function(points, useProtractor)
	{
		points = Resample(points, NumPoints);
		var radians = IndicativeAngle(points);
		points = RotateBy(points, -radians);
		points = ScaleTo(points, SquareSize);
		points = TranslateTo(points, Origin);
		var vector = Vectorize(points); // for Protractor

		var b = +Infinity;
		var u = -1;
		for (var i = 0; i < this.Unistrokes.length; i++) // for each unistroke
		{
			var d;
			if (useProtractor) // for Protractor
				d = OptimalCosineDistance(this.Unistrokes[i].Vector, vector);
			else // Golden Section Search (original $1)
				d = DistanceAtBestAngle(points, this.Unistrokes[i], -AngleRange, +AngleRange, AnglePrecision);
			if (d < b) {
				b = d; // best (least) distance
				u = i; // unistroke
			}
		}
		return (u == -1) ? new Result("No match.", 0.0) : new Result(this.Unistrokes[u].Name, useProtractor ? 1.0 / b : 1.0 - b / HalfDiagonal);
	};
	this.AddGesture = function(name, points)
	{
		this.Unistrokes[this.Unistrokes.length] = new Unistroke(name, points); // append new unistroke
		var num = 0;
		for (var i = 0; i < this.Unistrokes.length; i++) {
			if (this.Unistrokes[i].Name == name)
				num++;
		}
		return num;
	}
	this.DeleteUserGestures = function()
	{
		this.Unistrokes.length = NumUnistrokes; // clear any beyond the original set
		return NumUnistrokes;
	}
}
//
// Private helper functions from this point down
//
function Resample(points, n)
{
	var I = PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		var d = Distance(points[i - 1], points[i]);
		if ((D + d) >= I)
		{
			var qx = points[i - 1].X + ((I - D) / d) * (points[i].X - points[i - 1].X);
			var qy = points[i - 1].Y + ((I - D) / d) * (points[i].Y - points[i - 1].Y);
			var q = new dPoint(qx, qy);
			newpoints[newpoints.length] = q; // append new point 'q'
			points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
			D = 0.0;
		}
		else D += d;
	}
	if (newpoints.length == n - 1) // somtimes we fall a rounding-error short of adding the last point, so add it if so
		newpoints[newpoints.length] = new dPoint(points[points.length - 1].X, points[points.length - 1].Y);
	return newpoints;
}
function IndicativeAngle(points)
{
	var c = Centroid(points);
	return Math.atan2(c.Y - points[0].Y, c.X - points[0].X);
}
function RotateBy(points, radians) // rotates points around centroid
{
	var c = Centroid(points);
	var cos = Math.cos(radians);
	var sin = Math.sin(radians);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = (points[i].X - c.X) * cos - (points[i].Y - c.Y) * sin + c.X
		var qy = (points[i].X - c.X) * sin + (points[i].Y - c.Y) * cos + c.Y;
		newpoints[newpoints.length] = new dPoint(qx, qy);
	}
	return newpoints;
}
function ScaleTo(points, size) // non-uniform scale; assumes 2D gestures (i.e., no lines)
{
	var B = BoundingBox(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X * (size / B.Width);
		var qy = points[i].Y * (size / B.Height);
		newpoints[newpoints.length] = new dPoint(qx, qy);
	}
	return newpoints;
}
function TranslateTo(points, pt) // translates points' centroid
{
	var c = Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new dPoint(qx, qy);
	}
	return newpoints;
}
function Vectorize(points) // for Protractor
{
	var sum = 0.0;
	var vector = new Array();
	for (var i = 0; i < points.length; i++) {
		vector[vector.length] = points[i].X;
		vector[vector.length] = points[i].Y;
		sum += points[i].X * points[i].X + points[i].Y * points[i].Y;
	}
	var magnitude = Math.sqrt(sum);
	for (var i = 0; i < vector.length; i++)
		vector[i] /= magnitude;
	return vector;
}
function OptimalCosineDistance(v1, v2) // for Protractor
{
	var a = 0.0;
	var b = 0.0;
	for (var i = 0; i < v1.length; i += 2) {
		a += v1[i] * v2[i] + v1[i + 1] * v2[i + 1];
                b += v1[i] * v2[i + 1] - v1[i + 1] * v2[i];
	}
	var angle = Math.atan(b / a);
	return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
}
function DistanceAtBestAngle(points, T, a, b, threshold)
{
	var x1 = Phi * a + (1.0 - Phi) * b;
	var f1 = DistanceAtAngle(points, T, x1);
	var x2 = (1.0 - Phi) * a + Phi * b;
	var f2 = DistanceAtAngle(points, T, x2);
	while (Math.abs(b - a) > threshold)
	{
		if (f1 < f2) {
			b = x2;
			x2 = x1;
			f2 = f1;
			x1 = Phi * a + (1.0 - Phi) * b;
			f1 = DistanceAtAngle(points, T, x1);
		} else {
			a = x1;
			x1 = x2;
			f1 = f2;
			x2 = (1.0 - Phi) * a + Phi * b;
			f2 = DistanceAtAngle(points, T, x2);
		}
	}
	return Math.min(f1, f2);
}
function DistanceAtAngle(points, T, radians)
{
	var newpoints = RotateBy(points, radians);
	return PathDistance(newpoints, T.Points);
}
function Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new dPoint(x, y);
}
function BoundingBox(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++) {
		minX = Math.min(minX, points[i].X);
		minY = Math.min(minY, points[i].Y);
		maxX = Math.max(maxX, points[i].X);
		maxY = Math.max(maxY, points[i].Y);
	}
	return new Rectangle(minX, minY, maxX - minX, maxY - minY);
}
function PathDistance(pts1, pts2)
{
	var d = 0.0;
	for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
		d += Distance(pts1[i], pts2[i]);
	return d / pts1.length;
}
function PathLength(points)
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++)
		d += Distance(points[i - 1], points[i]);
	return d;
}
function Distance(p1, p2)
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	return Math.sqrt(dx * dx + dy * dy);
}
function Deg2Rad(d) { return (d * Math.PI / 180.0); }