export const users = [
  {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'Mathematician',
    location: 'London, UK',
    bio: 'Wrote the first algorithm intended to be processed by a machine.',
  },
  {
    id: 2,
    name: 'Grace Hopper',
    email: 'grace@example.com',
    role: 'Computer Scientist',
    location: 'New York, USA',
    bio: 'Pioneered compiler design and helped popularise COBOL.',
  },
  {
    id: 3,
    name: 'Alan Turing',
    email: 'alan@example.com',
    role: 'Computer Scientist',
    location: 'Manchester, UK',
    bio: 'Formalised computation with the Turing machine model.',
  },
  {
    id: 4,
    name: 'Katherine Johnson',
    email: 'katherine@example.com',
    role: 'Mathematician',
    location: 'Virginia, USA',
    bio: 'Calculated orbital trajectories for early NASA spaceflights.',
  },
  {
    id: 5,
    name: 'Radia Perlman',
    email: 'radia@example.com',
    role: 'Network Engineer',
    location: 'Massachusetts, USA',
    bio: 'Invented the Spanning Tree Protocol used in network bridges.',
  },
]

export function getUserById(id) {
  return users.find((user) => user.id === Number(id))
}

export function userLoader({ params }) {
  const user = getUserById(params.id)
  if (!user) throw new Response('User not found', { status: 404 })
  return user
}
