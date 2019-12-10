var faker = require('faker');

let generateProfile = () => {
	let { posts } = faker.helpers.createCard();
	return {
		name: faker.name.findName(),
		avatar: faker.image.avatar(),
		messages: posts,
	}
}

// collections

let friends = Array.from({ length: 5 }, (v, i) => generateProfile());

module.exports = () => {
	return {
		friends
	}
}